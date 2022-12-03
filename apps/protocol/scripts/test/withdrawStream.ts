import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import {
  currentTimestamp,
  getTsunami,
  receiverKeyPair,
  scanStreamUTXOFor,
  senderKeyPair,
  tsunamiAddress,
  recipient,
  provider,
} from './common';
import { prepareWithdraw } from './proof';

const { utils } = ethers;

const keyPairs = { sender: senderKeyPair, receiver: receiverKeyPair };
const readStream = async () => {
  const tsunami = await getTsunami();

  const streams = await scanStreamUTXOFor(keyPairs, 'receiver', tsunami);
  const stream = streams?.[0];

  console.log({ stream });

  return stream;
};

const main = async () => {
  const tsunami = await getTsunami();

  const streamUtxo = await readStream();

  const newCheckpointTime = await currentTimestamp();

  const { proofArgs, extData } = await prepareWithdraw({
    tsunami,
    input: streamUtxo,
    newCheckpointTime,
    keyPairs,
    recipient,
  });

  let balanceRecipient = await provider.getBalance(recipient);
  console.log('Balance recipient before:', balanceRecipient.toString());

  const tx = await tsunami.withdraw(proofArgs, extData, { gasLimit: 2_000_000 });
  // const tx = await tsunami.callStatic.withdraw(proofArgs, extData, { gasLimit: 2_000_000 });
  //   console.log('tx', tx);

  const receipt = await tx.wait();
  console.log('receipt', receipt);

  balanceRecipient = await provider.getBalance(recipient);
  console.log('Balance recipient after:', balanceRecipient.toString());
};

main();
