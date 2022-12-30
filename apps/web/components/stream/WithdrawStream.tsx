import { FC, useState } from 'react';
import { Button, HStack, Input, StackProps, Text, VStack } from '@chakra-ui/react';
import { isDev, rpcGoerli } from 'config/env';
import {
  useRegistrarContract,
  useTsunamiContract,
  useWTokenGatewayContract,
} from 'hooks/contracts';
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
import { providers, Wallet } from 'ethers';
import useInstance from 'hooks/instance';

const defaultSenderValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';
const defaultRecipientValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';

const WithdrawStream: FC<StackProps> = ({ ...props }) => {
  const [senderAddress, setSenderAddress] = useState(defaultSenderValue);
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipientValue);
  const [streamUtxo, setStreamUtxo] = useState<Utxo>();
  const [isLoading, setLoading] = useState(false);
  const registrarContract = useRegistrarContract();
  const { instanceAddress, rpcUrl } = useInstance();
  const tsunamiContract = useTsunamiContract();
  const wTokenGateway = useWTokenGatewayContract();
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

  const generateProofArgs = async () => {
    if (!address) {
      alert('Connect wallet first!');
      throw new Error('Not connected');
    }

    if (!isValidAddress(recipientAddress)) {
      alert('Invalid fund recipient address!');
      throw new Error('Invalid fund recipient address');
    }

    if (!receiverKeyPair) {
      logger.error(`Not logged in!`);
      alert('Log in with your shielded key!');
      throw new Error('Not logged in');
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
      recipient: wTokenGateway.address, // ONLY WHEN USING WTokenGateway
    });

    return { proofArgs, extData };
  };

  const startWithdraw = async () => {
    const { proofArgs, extData } = await generateProofArgs();
    await withdrawStream?.({
      ...data,
      recklesslySetUnpreparedArgs: [instanceAddress, recipientAddress, proofArgs, extData],
      recklesslySetUnpreparedOverrides: { gasLimit: BN(2_000_000) },
    });

    return true;
  };

  const simulateTest = async () => {
    setLoading(true);
    try {
      const { proofArgs, extData } = await generateProofArgs();
      const provider = new providers.JsonRpcProvider(rpcUrl);
      const wallet = new Wallet(
        '0x125f637a1047221090a4e49d71b1d5a98208e44451478b20e4df05d84946e7d3',
        provider,
      );

      logger.debug(`Simulating tx...`, rpcUrl);
      const contract = wTokenGateway.connect(wallet);

      const tx = await contract.callStatic.withdraw(
        instanceAddress,
        recipientAddress,
        proofArgs,
        extData,
        {
          gasLimit: BN(2_000_000),
        },
      );
      logger.debug(`Sent tx:`, tx);
    } catch (error) {
      logger.error(`Error:`, error);
    } finally {
      setLoading(false);
    }
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

          {isDev && (
            <Button
              onClick={simulateTest}
              isLoading={isLoading}
              colorScheme="orange"
              loadingText="Generating proof..."
            >
              Test
            </Button>
          )}
        </VStack>
      )}
    </VStack>
  );
};

export default WithdrawStream;
