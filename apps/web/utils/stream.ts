import { KeyPair, Utxo } from '@tsunami/utils';
import dayjs from 'dayjs';
import { Contract } from 'ethers';
import { BN, formatEther, parseEther, toFixedHex } from './eth';
import { poseidonHash } from './snark';

export const calculateTotalStreamAmount = (rate: number, startTime: Date, endTime: Date) => {
  const secondsDiff = dayjs(endTime).diff(dayjs(startTime), 'second');
  const ethAmount = parseEther(`${rate}`).mul(secondsDiff);
  return formatEther(ethAmount);
};

export function generateKeyPairFromSignature(signature: string) {
  const privateKey = toFixedHex(poseidonHash(signature));
  return new KeyPair(privateKey);
}

export const scanStreamUTXOFor = async (
  keyPairs: { sender: KeyPair; receiver: KeyPair },
  useKeyPair: 'sender' | 'receiver',
  tsunami: Contract,
  events?: any[],
) => {
  if (!events) {
    const filter = tsunami.filters.NewCommitment();
    events = await tsunami.queryFilter(filter, 0);
  }

  // console.log({ events });

  const outputs: Utxo[] = [];
  for (let i = events.length - 1; i >= 0; i--) {
    const args = events[i].args;
    try {
      const utxo = Utxo.decrypt(args.encryptedOutput, {
        senderKeyPair: keyPairs.sender,
        receiverKeyPair: keyPairs.receiver,
        useKeyPair,
        index: BN(args.index).toNumber(),
      });
      outputs.push(utxo);
    } catch (e) {}
  }

  const isSpentArray: boolean[] = await Promise.all(
    outputs.map((utxo) => tsunami.isSpent(toFixedHex(utxo.nullifier as string))),
  );

  const unspentOutputs = outputs.filter((_, i) => !isSpentArray[i]);

  return unspentOutputs;
  // const unspentOutputs = outputs.filter((_, i) => !isSpentArray[i]).reverse();
  // return unspentOutputs;
};
