import { Utxo } from '@tsunami/utils';
import dayjs from 'dayjs';
import { parseEther, toFixedHex } from 'utils/eth';
import { generateSnarkProofSolidity } from 'utils/snark';
import { calculateTotalStreamAmount } from 'utils/stream';

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

export async function prepareProposalProof({ output }: any) {
  const { proofArgs } = await generateProof({
    output,
  });

  return {
    proofArgs,
    encryptedOutput: output.encrypt(),
  };
}

export async function prepareProposal({ startTime, stopTime, rate, keyPairs }: any) {
  const output = new Utxo({
    amount: parseEther(`${calculateTotalStreamAmount(rate, startTime, stopTime)}`),
    startTime: dayjs(startTime).unix(),
    stopTime: dayjs(stopTime).unix(),
    checkpointTime: dayjs(startTime).unix(),
    rate: parseEther(`${rate}`),
    senderKeyPair: keyPairs.sender,
    leafIndex: keyPairs.receiver,
  });

  const { proofArgs, encryptedOutput } = await prepareProposalProof({
    output,
  });

  return {
    proofArgs,
    encryptedOutput,
  };
}
