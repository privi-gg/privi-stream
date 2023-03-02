import { FIELD_SIZE, Stream, StreamProver } from '@privi-stream/common';
//@ts-ignore
import * as snarkJs from 'snarkjs';

const circuitPath = {
  circuit: `./artifacts/circuits/create_js/create.wasm`,
  zKey: `./artifacts/circuits/create.zkey`,
};

export async function prepareCreate({ output }: { output: Stream }) {
  const prover = new StreamProver({
    snarkJs,
    fieldSize: FIELD_SIZE,
    circuitPath: circuitPath,
  });

  const { proofArgs, createData } = await prover.prepareCreateProof({ output });

  return {
    proofArgs,
    createData,
  };
}
