import { generateSnarkProofSolidity, toFixedHex } from '../utils';

async function generateProof({ output }: any) {
  const circuit = 'proposal';

  const proofInput = {
    amount: output.amount,
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
    amount: toFixedHex(proofInput.amount),
    commitment: toFixedHex(proofInput.commitment),
  };

  return {
    proofArgs,
  };
}

export async function prepareProposal({ output }: any) {
  const { proofArgs } = await generateProof({
    output,
  });

  return {
    proofArgs,
    encryptedOutput: output.encrypt(),
  };
}
