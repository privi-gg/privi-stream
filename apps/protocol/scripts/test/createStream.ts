import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import {
  currentTimestamp,
  getTsunami,
  receiverKeyPair,
  senderKeyPair,
  tsunamiAddress,
} from './common';
import { prepareProposal } from './proof';

const { utils } = ethers;

const main = async () => {
  const tsunami = await getTsunami();

  const duration = 1 * 60 * 60;
  const startTime = await currentTimestamp();
  const stopTime = startTime + duration;
  const rate = utils.parseEther('0.00001');
  const keyPairs = {
    sender: senderKeyPair,
    receiver: receiverKeyPair,
  };

  const { proofArgs, encryptedOutput } = await prepareProposal({
    startTime,
    stopTime,
    rate,
    keyPairs,
  });

  // const tx = await tsunami.callStatic.create(proofArgs, encryptedOutput, {
  //   value: BigNumber.from(proofArgs.amount),
  //   gasLimit: 2_000_000,
  // });
  const tx = await tsunami.create(proofArgs, encryptedOutput, {
    value: BigNumber.from(proofArgs.amount),
    gasLimit: 2_000_000,
  });
  // console.log('tx', tx);

  const receipt = await tx.wait();
  console.log('receipt', receipt);
};

main();
