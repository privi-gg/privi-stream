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
import { prepareWithdraw } from 'utils/proofs';
import { BN, currentBlockTimestamp, isValidAddress } from 'utils/eth';
import { Contract, providers, Wallet } from 'ethers';
import { tsunamiAddress } from 'config/network';
import tsunami from 'abi/tsunami.json';

const defaultSenderValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';
const defaultRecipientValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';

const WithdrawStream: FC<StackProps> = ({ ...props }) => {
  const [senderAddress, setSenderAddress] = useState(defaultSenderValue);
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipientValue);
  const [streamUtxo, setStreamUtxo] = useState<Utxo>();
  const [isLoading, setLoading] = useState(false);
  const registrarContract = useRegistrarContract();
  const tsunamiContract = useTsunamiContract();
  const provider = useProvider();
  const { address } = useAccount();
  const { keyPair: receiverKeyPair } = useShieldedAccount();

  const { isSuccess, isError, data, writeAsync: withdrawStream } = useWithdrawStream();

  const fetchStreamUtxo = async () => {
    setLoading(true);
    if (!address) {
      alert('Connect wallet first!');
      setLoading(false);
      return;
    }
    if (!receiverKeyPair) {
      alert('Log in first!');
      setLoading(false);
      return;
    }

    const { keyPair: senderKeyPair } = await getShieldedAccount(senderAddress, registrarContract);
    if (!senderKeyPair) {
      alert('Sender address is not registered!');
      setLoading(false);
      return;
    }
    const keyPairs = { sender: senderKeyPair, receiver: receiverKeyPair };
    const streams = await scanStreamUTXOFor(keyPairs, 'receiver', tsunamiContract);
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

    if (!receiverKeyPair) {
      logger.error(`Not logged in!`);
      alert('Log in with your shielded key!');
      return;
    }

    const { keyPair: senderKeyPair } = await getShieldedAccount(senderAddress, registrarContract);
    if (!receiverKeyPair) {
      alert('Receiver address is not registered!');
      throw new Error('Receiver not registered');
    }

    const newCheckpointTime = await currentBlockTimestamp(provider);

    const { proofArgs, extData } = await prepareWithdraw({
      tsunami: tsunamiContract,
      input: streamUtxo,
      keyPairs: {
        sender: senderKeyPair,
        receiver: receiverKeyPair,
      },
      newCheckpointTime,
      recipient: recipientAddress,
    });

    console.log(`Withdraw proof generated!`);

    await withdrawStream?.({
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

    const tx = await pool.callStatic.withdraw(args, extData, {
      gasLimit: 2_000_000,
    });
    console.log('Sent tx');
    console.log(tx);
  };

  return (
    <VStack alignItems="stretch" spacing={10} {...props}>
      <VStack alignItems="flex-start">
        <Text>Stream Sender (Registered) Address</Text>
        <Input
          onChange={(e) => setSenderAddress(e.target.value)}
          defaultValue={defaultSenderValue}
        />
      </VStack>
      <Button onClick={fetchStreamUtxo} isLoading={isLoading}>
        Fetch Stream
      </Button>
      {streamUtxo && (
        <VStack alignItems="stretch" px={12}>
          <WithdrawStreamDetail utxo={streamUtxo} />
          <VStack alignItems="stretch">
            <Text>Fund recipient address:</Text>
            <Input
              onChange={(e) => setRecipientAddress(e.target.value)}
              defaultValue={defaultRecipientValue}
            />
          </VStack>
          <Button onClick={submit} isLoading={isLoading} loadingText="Generating proof...">
            Withdraw
          </Button>
        </VStack>
      )}
    </VStack>
  );
};

export default WithdrawStream;
