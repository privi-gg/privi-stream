import { KeyPair, Utxo } from '@tsunami/utils';
import { BigNumber, Contract } from 'ethers';
import { ethers, artifacts } from 'hardhat';
import { toFixedHex } from '../../test/helpers/utils';
const { utils, providers, Wallet } = ethers;

export const recipient = '0x80630fBf405eD070F10c8fFE8E9A83C60736a770';

export const senderKeyPair = new KeyPair(
  '0x1f84f832b1f8ca56b5173ca1840b06619a1f8678b90a52e6e5b16654112c393f',
);
export const receiverKeyPair = new KeyPair(
  '0x17127c3cf67b647bbebc58a63911f35903bff485c4aa47295366c485cc6ab2bb',
);

// export const tsunamiAddress = '0xc4c55B2c2Bb6fD0229A7aA508e33bc4Ca54D0aa0'; // wETH withdraws
export const tsunamiAddress = '0x56aDcC1BaF658C19FA4B149270e351db01957ca4'; // ETH withdraws

const rpcUrl = process.env.RPC_GOERLI as string;
const privateKeys = (process.env.PRIVATE_KEYS_TEST as string).split(',');
export const provider = new providers.JsonRpcProvider(rpcUrl);
export const wallet = new Wallet(privateKeys[0], provider);

const tsunamiArtifact = artifacts.readArtifactSync('Tsunami');

export const getTsunami = async () => {
  const tsunami = await ethers.getContractAtFromArtifact(tsunamiArtifact, tsunamiAddress, wallet);
  return tsunami;
};

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
        index: BigNumber.from(args.index).toNumber(),
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

export const currentTimestamp = async () => {
  return provider.getBlock('latest').then((block) => block.timestamp);
};
