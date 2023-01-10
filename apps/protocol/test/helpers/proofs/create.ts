import { Utxo } from '@tsunami/utils';
import { generateSnarkProofSolidity, toFixedHex } from '../utils';

async function generateProof({ output }: { output: Utxo }) {
  const circuit = 'create';

  const proofInput = {
    publicAmount: output.amount,
    startTime: output.startTime,
    stopTime: output.stopTime,
    checkpointTime: output.checkpointTime,
    rate: output.rate,
    senderPrivateKey: output.senderKeyPair.privateKey,
    receiverPublicKey: output.receiverKeyPair.publicKey,
    blinding: output.blinding,
    commitment: output.commitment,
  };

  const { proof } = await generateSnarkProofSolidity(proofInput, circuit);

  const proofArgs = {
    proof,
    publicAmount: toFixedHex(proofInput.publicAmount),
    commitment: toFixedHex(proofInput.commitment),
  };

  return {
    proofArgs,
  };
}

export async function prepareCreate({ output }: { output: Utxo }) {
  const { proofArgs } = await generateProof({
    output,
  });

  return {
    proofArgs,
    encryptedOutput: output.encrypt(),
  };
}
