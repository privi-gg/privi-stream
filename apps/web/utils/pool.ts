import { Contract } from 'ethers';
import { Checkpoint, ShieldedWallet, Stream } from '@privi-stream/common';
import { BN, poseidonHash, toFixedHex } from 'privi-utils';

export const fetchUserShieldedAccount = async (address: string, registrar: Contract) => {
  const registerEventFilter = registrar.filters.ShieldedAddress(address);
  const events = await registrar.queryFilter(registerEventFilter);
  const shieldedAddress = events?.[events.length - 1]?.args?.shieldedAddress;

  if (shieldedAddress) {
    return ShieldedWallet.fromAddress(shieldedAddress);
  }
};

export const fetchStreamEvents = (pool: Contract) => {
  const filter = pool.filters.StreamInserted();
  const eventData = pool.queryFilter(filter, 0);
  return eventData;
};

export const fetchCheckpointEvents = (pool: Contract) => {
  const filter = pool.filters.CheckpointInserted();
  const eventData = pool.queryFilter(filter, 0);
  return eventData;
};

export const fetchReceiverCheckpoints = async (
  pool: Contract,
  shieldedWallet: ShieldedWallet,
  stream: Stream,
) => {
  const eventsList = await fetchCheckpointEvents(pool);

  const checkpoints: Checkpoint[] = [];
  for (let i = eventsList.length - 1; i >= 0; i--) {
    const encryptedData = eventsList[i]?.args?.encryptedDataReceiver as string;
    const leafIndex = BN(eventsList[i]?.args?.leafIndex || 0).toNumber();
    try {
      const checkpoint = Checkpoint.decrypt(encryptedData, {
        stream,
        shieldedWallet,
        leafIndex,
      });
      checkpoints.push(checkpoint);
    } catch (e) {}
  }

  console.log({ checkpoints });

  const isNullifiedArray: boolean[] = await Promise.all(
    checkpoints.map((c) => pool.isCheckpointNullifierUsed(toFixedHex(c.nullifier as string))),
  );

  const unspentOutputs = checkpoints.filter((_, i) => !isNullifiedArray[i]).reverse();

  return unspentOutputs;
};

export const fetchReceiverStreams = async (shieldedWallet: ShieldedWallet, pool: Contract) => {
  const eventsList = await fetchStreamEvents(pool);

  const streams: Stream[] = [];
  for (let i = eventsList.length - 1; i >= 0; i--) {
    const encryptedData = eventsList[i]?.args?.encryptedDataReceiver as string;
    const leafIndex = BN(eventsList[i]?.args?.leafIndex || 0).toNumber();
    try {
      const stream = Stream.receiverDecrypt(encryptedData, {
        receiverShieldedWallet: shieldedWallet,
        leafIndex,
      });
      streams.push(stream);
    } catch (e) {}
  }

  return streams.reverse();

  // const isNullifiedArray: boolean[] = await Promise.all(
  //   streams.map((s) => pool.isStreamNullifierUsed(toFixedHex(s.nullifier as string))),
  // );

  // const unspentOutputs = streams.filter((_, i) => !isNullifiedArray[i]).reverse();

  // return unspentOutputs;
};

export function generateShieldedWalletFromSignature(signature: string) {
  const privateKey = toFixedHex(poseidonHash(signature));
  return new ShieldedWallet(privateKey);
}
