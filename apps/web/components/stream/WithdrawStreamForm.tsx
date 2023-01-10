import { FC, useEffect, useState } from 'react';
import { Avatar, Button, HStack, StackProps, Text, VStack } from '@chakra-ui/react';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAccount, useProvider } from 'wagmi';
import { Utxo } from '@tsunami/utils';
import { isDev, testPrivateKey } from 'config/env';
import { FormAddressInput } from 'components/form';
import { useForm } from 'react-hook-form';
import {
  useRegistrarContract,
  useTsunamiContract,
  useWTokenGatewayContract,
} from 'hooks/contracts';
import useInstance from 'hooks/instance';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { getShieldedAccount } from 'api/getShieldedAccounts';
import { ChevronRightIcon } from 'components/icons';
import logger from 'utils/logger';
import { BN, latestBlockTimestamp, isValidAddress, formatUnits } from 'utils/eth';
import { useWithdrawStream } from 'api/withdrawStream';
import { prepareWithdraw } from 'utils/proofs';
import { Wallet } from 'ethers';
import { formatDate } from 'utils/datetime';
import { TokenPriceText } from 'components/common';

const defaultRecipientValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';

interface IWithdrawStreamInput {
  recipientAddress: string;
}

interface IWithdrawStreamFormProps extends StackProps {
  stream: Utxo;
  senderAddress: string;
}

const schema = yup.object().shape({
  recipientAddress: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

const WithdrawStreamForm: FC<IWithdrawStreamFormProps> = ({ stream, senderAddress, ...props }) => {
  const [isLoading, setLoading] = useState(false);
  const [streamedAmount, setStreamedAmount] = useState(BN(0));
  const { control, handleSubmit, getValues } = useForm<IWithdrawStreamInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      recipientAddress: isDev ? defaultRecipientValue : undefined,
    },
  });
  const registrarContract = useRegistrarContract();
  const { instanceAddress, instance } = useInstance();
  const tsunamiContract = useTsunamiContract();
  const wTokenGateway = useWTokenGatewayContract();
  const provider = useProvider();
  const { address } = useAccount();
  const { keyPair: receiverKeyPair } = useShieldedAccount();
  const { isSuccess, isError, data, writeAsync: withdrawStream } = useWithdrawStream();

  useEffect(() => {
    if (!stream) return;

    provider
      .getBlock('latest')
      .then((b) => b.timestamp)
      .then((currentTime) => {
        const min = Math.min(currentTime, stream.stopTime);

        if (currentTime <= stream.checkpointTime) {
          setStreamedAmount(BN(0));
        } else {
          const amt = stream.rate.mul(min - stream.checkpointTime);
          setStreamedAmount(amt);
        }
      });
  }, [stream, provider]);

  const submit = (data: IWithdrawStreamInput) => {
    setLoading(true);
    startWithdraw(data)
      .then(() => {
        logger.log(`Sent tx`);
      })
      .catch((err) => {
        logger.error(`Error:`, err);
        alert('Error occurred!');
      })
      .finally(() => setLoading(false));
  };

  const generateProofArgs = async ({ recipientAddress }: IWithdrawStreamInput) => {
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

    const newCheckpointTime = await latestBlockTimestamp(provider);

    const { proofArgs, extData } = await prepareWithdraw({
      tsunami: tsunamiContract,
      input: stream,
      keyPairs: {
        sender: senderKeyPair,
        receiver: receiverKeyPair,
      },
      newCheckpointTime,
      recipient: wTokenGateway.address, // ONLY WHEN USING WTokenGateway
    });

    return { proofArgs, extData };
  };

  const startWithdraw = async ({ recipientAddress }: IWithdrawStreamInput) => {
    const { proofArgs, extData } = await generateProofArgs({ recipientAddress });
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
      const { recipientAddress } = getValues();
      const { proofArgs, extData } = await generateProofArgs({ recipientAddress });
      const wallet = new Wallet(testPrivateKey, provider);

      logger.debug(`Simulating tx...`);
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

  const lastWithdrawTime = stream.startTime === stream.checkpointTime ? 0 : stream.checkpointTime;

  return (
    <VStack bgColor="primary.50" p={8} alignItems="stretch" rounded="md" spacing={8} {...props}>
      <VStack alignItems="stretch" spacing={8}>
        <HStack justify="space-between">
          <Text color="gray.500">Last Withdraw Time</Text>
          {lastWithdrawTime > 0 ? (
            <Text fontWeight="bold">{formatDate(lastWithdrawTime * 1000)}</Text>
          ) : (
            <Text fontSize="sm" fontWeight="bold" p={2} rounded="3xl" bg="gray.300">
              Haven&apos;t withdrawn anything yet
            </Text>
          )}
        </HStack>
        <HStack justify="space-between">
          <Text color="gray.500">You can withdraw</Text>
          <HStack alignItems="center">
            <TokenPriceText amount={streamedAmount} fontWeight="bold" color="gray.400" />
            <Avatar src={instance.iconUrl} size="xs" />
            <Text fontWeight="bold">
              {formatUnits(streamedAmount, 18)} {instance.currency}
            </Text>
          </HStack>
        </HStack>
      </VStack>
      <VStack as="form" alignItems="stretch" spacing={10} onSubmit={handleSubmit(submit)}>
        <FormAddressInput
          label="Fund's Recipient Address"
          name="recipientAddress"
          control={control}
        />
        <Button type="submit" rightIcon={<ChevronRightIcon />} isLoading={isLoading}>
          Withdraw
        </Button>
        {isDev && (
          <Button colorScheme="orange" isLoading={isLoading} onClick={simulateTest}>
            Test
          </Button>
        )}
      </VStack>
    </VStack>
  );
};

export default WithdrawStreamForm;
