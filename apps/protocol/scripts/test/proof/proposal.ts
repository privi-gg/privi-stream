import { Utxo } from '@tsunami/utils';
import { BigNumber, utils } from 'ethers';
import { generateSnarkProofSolidity, toFixedHex } from '../../../test/helpers/utils';
// import { parseEther, toFixedHex } from 'utils/eth';
// import { generateSnarkProofSolidity } from 'utils/snark';
// import { calculateTotalStreamAmount } from 'utils/stream';

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

export async function prepareProposalProofs({ output }: any) {
  const { proofArgs } = await generateProof({
    output,
  });

  return {
    proofArgs,
    encryptedOutput: output.encrypt(),
  };
}

export async function prepareProposal({ startTime, stopTime, rate, keyPairs }: any) {
  const amount = BigNumber.from(rate).mul(stopTime - startTime);
  console.log({ amount: utils.formatEther(amount) });

  const utxo = new Utxo({
    amount: amount,
    startTime,
    stopTime,
    checkpointTime: startTime,
    rate: BigNumber.from(rate),
    senderKeyPair: keyPairs.sender,
    receiverKeyPair: keyPairs.receiver,
  });

  return prepareProposalProofs({ output: utxo });
}
