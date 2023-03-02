import { FIELD_SIZE, ShieldedWallet, Stream, StreamProver } from '@privi-stream/common';
import { BigNumberish } from 'ethers';

const circuitPath = {
  circuit: `/circuits/create.wasm`,
  zKey: `/circuits/create.zkey`,
};

export async function prepareCreateProof({
  startTime,
  stopTime,
  rate,
  from,
  to,
}: {
  startTime: number;
  stopTime: number;
  rate: BigNumberish;
  from: ShieldedWallet;
  to: ShieldedWallet;
}) {
  //@ts-ignore
  const snarkJs = window.snarkjs;

  const prover = new StreamProver({
    snarkJs,
    fieldSize: FIELD_SIZE,
    circuitPath,
  });

  const output = new Stream({
    startTime,
    stopTime,
    rate,
    senderShieldedWallet: from,
    receiverShieldedWallet: to,
  });

  const { proofArgs, createData } = await prover.prepareCreateProof({ output });

  return {
    proofArgs,
    createData,
  };
}
