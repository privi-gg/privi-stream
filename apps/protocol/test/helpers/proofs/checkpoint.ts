import { ethers } from 'hardhat';
import { BigNumberish, Contract } from 'ethers';
import MerkleTree from 'fixed-merkle-tree';
import { CHECKPOINT_TREE_LEVELS, FIELD_SIZE, STREAM_TREE_LEVELS } from '../constants';
import { poseidonHash, toFixedHex } from 'privi-utils';
import {
  Checkpoint,
  CheckpointProver,
  ZERO_LEAF_CHECKPOINT,
  ZERO_LEAF_STREAM,
} from '@privi-stream/common';
//@ts-ignore
import * as snarkJs from 'snarkjs';

// const { utils, BigNumber } = ethers;

const circuitPath = {
  circuit: `./artifacts/circuits/checkpoint_js/checkpoint.wasm`,
  zKey: `./artifacts/circuits/checkpoint.zkey`,
};

// function hashExtData({ recipient, withdrawAmount, relayer, fee, encryptedOutput }: any) {
//   const abi = new utils.AbiCoder();

//   const encodedData = abi.encode(
//     [
//       'tuple(address recipient,uint256 withdrawAmount,address relayer,uint256 fee,bytes encryptedOutput)',
//     ],
//     [
//       {
//         recipient: toFixedHex(recipient, 20),
//         withdrawAmount: toFixedHex(withdrawAmount),
//         relayer: toFixedHex(relayer, 20),
//         fee: toFixedHex(fee),
//         encryptedOutput,
//       },
//     ],
//   );
//   const hash = utils.keccak256(encodedData);
//   return BigNumber.from(hash).mod(FIELD_SIZE);
// }

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

export async function prepareWithdraw({
  pool,
  input,
  output,
  currentTime = Math.floor(Date.now() / 1000),
  fee = 0,
  recipient = 0,
  relayer = 0,
}: {
  pool: Contract;
  input: Checkpoint;
  output: Checkpoint;
  currentTime: number;
  fee?: BigNumberish;
  recipient?: BigNumberish;
  relayer?: BigNumberish;
}) {
  if (currentTime < output.checkpointTime) {
    throw new Error('Current time is less than output checkpoint time');
  }

  const withdrawAmount = input.stream.rate
    .mul(output.checkpointTime - input.checkpointTime)
    .toString();

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
