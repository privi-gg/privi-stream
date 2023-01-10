import { Utxo } from '@tsunami/utils';
import dayjs from 'dayjs';
import { parseEther, toFixedHex } from 'utils/eth';
import { generateSnarkProofSolidity } from 'utils/snark';

async function generateProof({ output }: any) {
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

export async function prepareCreateProof({ output }: any) {
  const { proofArgs } = await generateProof({
    output,
  });

  return {
    proofArgs,
    encryptedOutput: output.encrypt(),
  };
}

export async function prepareCreate({ startTime, stopTime, rate, keyPairs }: any) {
  const output = new Utxo({
    startTime: dayjs(startTime).unix(),
    stopTime: dayjs(stopTime).unix(),
    checkpointTime: dayjs(startTime).unix(),
    rate: parseEther(`${rate}`),
    senderKeyPair: keyPairs.sender,
    receiverKeyPair: keyPairs.receiver,
  });

  const { proofArgs, encryptedOutput } = await prepareCreateProof({
    output,
  });

  return {
    proofArgs,
    encryptedOutput,
  };
}
