import { FIELD_SIZE, Stream, StreamProver } from '@privi-stream/common';
//@ts-ignore
import * as snarkJs from 'snarkjs';
// import { generateSnarkProofSolidity } from 'privi-utils';

// async function generateProof({ output }: { output: Utxo }) {
//   const circuit = 'create';

//   const proofInput = {
//     publicAmount: output.amount,
//     startTime: output.startTime,
//     stopTime: output.stopTime,
//     checkpointTime: output.checkpointTime,
//     rate: output.rate,
//     senderPrivateKey: output.senderKeyPair.privateKey,
//     receiverPublicKey: output.receiverKeyPair.publicKey,
//     blinding: output.blinding,
//     commitment: output.commitment,
//   };

//   const { proof } = await generateSnarkProofSolidity(proofInput, circuit);

//   const proofArgs = {
//     proof,
//     publicAmount: toFixedHex(proofInput.publicAmount),
//     commitment: toFixedHex(proofInput.commitment),
//   };

//   return {
//     proofArgs,
//   };
// }

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
