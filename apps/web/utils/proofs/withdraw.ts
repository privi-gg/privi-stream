import { BigNumberish, Contract, logger } from 'ethers';
import {
  ZERO_LEAF_STREAM,
  ZERO_LEAF_CHECKPOINT,
  Stream,
  Checkpoint,
  CheckpointProver,
  FIELD_SIZE,
  ShieldedWallet,
} from '@privi-stream/common';
import { formatEther, poseidonHash, toFixedHex } from 'privi-utils';
import MerkleTree from 'fixed-merkle-tree';
import { fetchReceiverCheckpoints } from 'utils/pool';

const STREAM_TREE_LEVELS = 21;
const CHECKPOINT_TREE_LEVELS = 23;

const circuitPath = {
  circuit: `/circuits/checkpoint.wasm`,
  zKey: `/circuits/checkpoint.zkey`,
};

async function buildStreamTree(pool: Contract) {
  const filter = pool.filters.StreamInserted();
  const events = await pool.queryFilter(filter, 0);

  const leaves = events
    .sort((a, b) => a.args?.leafIndex - b.args?.leafIndex)
    .map((e) => toFixedHex(e.args?.commitment));

  return new MerkleTree(STREAM_TREE_LEVELS, leaves, {
    hashFunction: poseidonHash,
    zeroElement: ZERO_LEAF_STREAM,
  });
}

async function buildCheckpointTree(pool: Contract) {
  const filter = pool.filters.CheckpointInserted();
  const events = await pool.queryFilter(filter, 0);

  const leaves = events
    .sort((a, b) => a.args?.leafIndex - b.args?.leafIndex)
    .map((e) => toFixedHex(e.args?.commitment));
  return new MerkleTree(CHECKPOINT_TREE_LEVELS, leaves, {
    hashFunction: poseidonHash,
    zeroElement: ZERO_LEAF_CHECKPOINT,
  });
}

export async function prepareWithdrawProof({
  pool,
  stream,
  outCheckpointTime,
  currentTime,
  shieldedWallet,
  recipient,
  fee = 0,
  relayer = 0,
}: {
  pool: Contract;
  stream: Stream;
  currentTime: number;
  outCheckpointTime: number;
  shieldedWallet: ShieldedWallet;
  fee?: BigNumberish;
  recipient: BigNumberish;
  relayer?: BigNumberish;
}) {
  //@ts-ignore
  const snarkJs = window.snarkjs;
  if (currentTime < outCheckpointTime) {
    throw new Error('Current time is less than output checkpoint time');
  }

  const checkpoints = await fetchReceiverCheckpoints(pool, shieldedWallet, stream);
  let input = checkpoints.find((c) => c.stream.commitment === stream.commitment);
  if (!input) {
    logger.info(`No previous checkpoint found, using zero checkpoint as input`);
    input = Checkpoint.zero(stream);
  }

  const output = new Checkpoint({
    stream,
    checkpointTime: outCheckpointTime,
    shieldedWallet,
  });

  const withdrawAmount = stream.rate.mul(output.checkpointTime - input.checkpointTime);
  logger.info(`Withdraw amount: ${formatEther(withdrawAmount)}`);

  const streamTree = await buildStreamTree(pool);
  const checkpointTree = await buildCheckpointTree(pool);

  const prover = new CheckpointProver({
    snarkJs,
    fieldSize: FIELD_SIZE,
    circuitPath,
    streamTree,
    checkpointTree,
  });

  const { proofArgs, withdrawData: extData } = await prover.prepareCheckpointProof({
    input,
    output,
    currentTime,
    withdrawAmount,
    fee,
    recipient,
    relayer,
  });

  return {
    proofArgs,
    extData,
  };
}
