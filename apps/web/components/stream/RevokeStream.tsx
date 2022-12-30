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
import logger from 'utils/logger';
import { prepareRevoke, prepareWithdraw } from 'utils/proofs';
import { BN, currentBlockTimestamp, isValidAddress } from 'utils/eth';
import { Contract, providers, Wallet } from 'ethers';
import tsunami from 'abi/tsunami.json';
import { useRevokeStream } from 'api/revokeStream';
import RevokeStreamDetail from './RevokeStreamDetails';
import useInstance from 'hooks/instance';

const defaultReceiverValue = isDev ? '0x3C6860DA6ED0939AE9f668476ca9B48Bcc4Ea939' : '';
const defaultRecipientValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';

const RevokeStream: FC<StackProps> = ({ ...props }) => {
  const [receiverAddress, setReceiverAddress] = useState(defaultReceiverValue);
  const [recipientAddress, setRecipientAddress] = useState(defaultRecipientValue);
  const [streamUtxo, setStreamUtxo] = useState<Utxo>();
  const [isLoading, setLoading] = useState(false);
  const registrarContract = useRegistrarContract();
  const tsunamiContract = useTsunamiContract();
  const { instanceAddress, rpcUrl } = useInstance();
  const wTokenGateway = useWTokenGatewayContract();
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
      alert('No stream found for logged in shielded account by given sender!');
      setLoading(false);
      return;
    }
    setStreamUtxo(streamUtxo);
    setLoading(false);
  };

  const submit = () => {
    setLoading(true);
    startRevoke()
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
      throw new Error('Invalid recipient address');
    }

    if (!senderKeyPair) {
      logger.error(`Not logged in!`);
      alert('Log in with your shielded key!');
      throw new Error('Not logged in');
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
      throw new Error('Too late to stop stream');
    }

    const { proofArgs, extData } = await prepareRevoke({
      tsunami: tsunamiContract,
      input: streamUtxo,
      keyPairs: {
        sender: senderKeyPair,
        receiver: receiverKeyPair,
      },
      newStopTime,
      recipient: wTokenGateway.address,
    });

    return { proofArgs, extData };
  };

  const startRevoke = async () => {
    const { proofArgs, extData } = await generateProofArgs();

    await revokeStream?.({
      ...data,
      recklesslySetUnpreparedArgs: [instanceAddress, receiverAddress, proofArgs, extData],
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

      const tx = await contract.callStatic.revoke(
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

export default RevokeStream;
