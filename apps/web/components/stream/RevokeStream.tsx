import { FC, useState } from 'react';
import { Button, HStack, Input, StackProps, Text, VStack } from '@chakra-ui/react';
import { isDev, rpcUrlGoerli } from 'config/env';
import { useRegistrarContract, useTsunamiContract } from 'hooks/contracts';
import { useAccount, useProvider } from 'wagmi';
import { Utxo } from '@tsunami/utils';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { scanStreamUTXOFor } from 'utils/stream';
import { getShieldedAccount } from 'api/getShieldedAccounts';
import { useWithdrawStream } from 'api/withdrawStream';
import WithdrawStreamDetail from './WithdrawStreamDetails';
import logger from 'utils/logger';
import { prepareRevoke, prepareWithdraw } from 'utils/proofs';
import { BN, currentBlockTimestamp, isValidAddress } from 'utils/eth';
import { Contract, providers, Wallet } from 'ethers';
import { tsunamiAddress } from 'config/network';
import tsunami from 'abi/tsunami.json';
import { useRevokeStream } from 'api/revokeStream';
import RevokeStreamDetail from './RevokeStreamDetails';

const defaultReceiverValue = isDev ? '0x3C6860DA6ED0939AE9f668476ca9B48Bcc4Ea939' : '';
const defaultRecipientValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';

const RevokeStream: FC<StackProps> = ({ ...props }) => {
  const [receiverAddress, setReceiverAddress] = useState(defaultReceiverValue);
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipientValue);
  const [streamUtxo, setStreamUtxo] = useState<Utxo>();
  const [isLoading, setLoading] = useState(false);
  const registrarContract = useRegistrarContract();
  const tsunamiContract = useTsunamiContract();
  const provider = useProvider();
  const { address } = useAccount();
  const { keyPair: senderKeyPair } = useShieldedAccount();

  const { isSuccess, isError, data, writeAsync: revokeStream } = useRevokeStream();

  const fetchStreamUtxo = async () => {
    setLoading(true);
    if (!address) {
      alert('Connect wallet first!');
      setLoading(false);
      return;
    }
    if (!senderKeyPair) {
      alert('Log in first!');
      setLoading(false);
      return;
    }

    const { keyPair: receiverKeyPair } = await getShieldedAccount(
      receiverAddress,
      registrarContract,
    );
    if (!receiverKeyPair) {
      alert('Receiver address is not registered!');
      setLoading(false);
      return;
    }
    const keyPairs = { sender: senderKeyPair, receiver: receiverKeyPair };
    const streams = await scanStreamUTXOFor(keyPairs, 'sender', tsunamiContract);
    const streamUtxo = streams?.[0];
    if (!streamUtxo) {
      // console.log({ streamUtxo });

      alert('No stream found for logged in shielded account by given sender!');
      setLoading(false);
      return;
    }
    setStreamUtxo(streamUtxo);
    setLoading(false);
  };

  const submit = () => {
    setLoading(true);
    startWithdraw()
      .then(() => {
        logger.log(`Sent tx`);
      })
      .catch((err) => {
        logger.error(`Error:`, err);
        alert('Error occurred!');
      })
      .finally(() => setLoading(false));
  };

  const startWithdraw = async () => {
    if (!address) {
      alert('Connect wallet first!');
      return;
    }

    if (!isValidAddress(recipientAddress)) {
      alert('Invalid fund recipient address!');
      return;
    }

    if (!senderKeyPair) {
      logger.error(`Not logged in!`);
      alert('Log in with your shielded key!');
      return;
    }

    const { keyPair: receiverKeyPair } = await getShieldedAccount(
      receiverAddress,
      registrarContract,
    );
    if (!receiverKeyPair) {
      alert('Receiver address is not registered!');
      throw new Error('Receiver not registered');
    }

    const newStopTime = (await currentBlockTimestamp(provider)) + 4 * 60;
    if (streamUtxo && newStopTime >= streamUtxo?.stopTime) {
      alert('Too late to stop stream! Stream ending soon anyway!');
      return;
    }

    const { proofArgs, extData } = await prepareRevoke({
      tsunami: tsunamiContract,
      input: streamUtxo,
      keyPairs: {
        sender: senderKeyPair,
        receiver: receiverKeyPair,
      },
      newStopTime,
      recipient: recipientAddress,
    });

    console.log(`Revoke proof generated!`);

    await revokeStream?.({
      ...data,
      recklesslySetUnpreparedArgs: [proofArgs, extData],
      recklesslySetUnpreparedOverrides: { gasLimit: BN(2_000_000) },
    });
    // await runTest(proofArgs, extData);

    return true;
  };

  const runTest = async (args: any, extData: any) => {
    const provider = new providers.JsonRpcProvider(rpcUrlGoerli);
    const wallet = new Wallet(
      '0x125f637a1047221090a4e49d71b1d5a98208e44451478b20e4df05d84946e7d3',
      provider,
    );
    console.log({ addr: wallet.address });

    console.log('Simulating');

    const pool = new Contract(tsunamiAddress, tsunami.abi, wallet);

    const tx = await pool.callStatic.revoke(args, extData, {
      gasLimit: BN(2_000_000),
    });
    console.log('Sent tx');
    console.log(tx);
  };

  return (
    <VStack alignItems="stretch" spacing={10} {...props}>
      <VStack alignItems="flex-start">
        <Text>Stream Receiver (Registered) Address</Text>
        <Input
          onChange={(e) => setReceiverAddress(e.target.value)}
          defaultValue={defaultReceiverValue}
        />
      </VStack>
      <Button onClick={fetchStreamUtxo} isLoading={isLoading}>
        Fetch Stream
      </Button>
      {streamUtxo && (
        <VStack alignItems="stretch" px={12}>
          <RevokeStreamDetail utxo={streamUtxo} />
          <VStack alignItems="stretch">
            <Text>Fund (not yet streamed) recipient address:</Text>
            <Input
              onChange={(e) => setRecipientAddress(e.target.value)}
              defaultValue={defaultRecipientValue}
            />
          </VStack>
          <Button onClick={submit} isLoading={isLoading} loadingText="Generating proof...">
            Revoke/Stop Stream
          </Button>
        </VStack>
      )}
    </VStack>
  );
};

export default RevokeStream;
