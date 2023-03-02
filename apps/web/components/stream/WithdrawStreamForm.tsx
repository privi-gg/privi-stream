import { FC, useEffect, useState } from 'react';
import { Avatar, Button, HStack, StackProps, Text, VStack } from '@chakra-ui/react';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useProvider } from 'wagmi';
import { isDev, testWallet1 } from 'config/env';
import { FormAddressInput } from 'components/form';
import { useForm } from 'react-hook-form';
import { ChevronRightIcon } from 'components/icons';
import logger from 'utils/logger';
import { formatDate, now } from 'utils/datetime';
import { TokenPriceText } from 'components/common';
import { Checkpoint } from '@privi-stream/common';
import { BN, formatUnits } from 'privi-utils';
import { useInstance } from 'contexts/instance';
import { usePoolWithdrawStreamNative } from 'api/pool';

interface IWithdrawStreamInput {
  recipientAddress: string;
}

interface IWithdrawStreamFormProps extends StackProps {
  checkpoint: Checkpoint;
  senderAddress?: string;
}

const schema = yup.object().shape({
  recipientAddress: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

const WithdrawStreamForm: FC<IWithdrawStreamFormProps> = ({
  checkpoint,
  senderAddress,
  ...props
}) => {
  const [isLoading, setLoading] = useState(false);
  const [streamedAmount, setStreamedAmount] = useState(BN(0));
  const { instance } = useInstance();
  const { control, handleSubmit, getValues } = useForm<IWithdrawStreamInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      recipientAddress: isDev ? testWallet1?.address : undefined,
    },
  });
  const { withdrawStreamAsync, testAsync } = usePoolWithdrawStreamNative({
    poolAddress: instance?.pool,
  });
  const provider = useProvider();

  useEffect(() => {
    if (!checkpoint?.stream) return;
    const stream = checkpoint.stream;

    provider
      .getBlock('latest')
      .then((b) => b.timestamp)
      .then((currentTime) => {
        const min = Math.min(currentTime, stream.stopTime);

        if (currentTime <= checkpoint.checkpointTime) {
          setStreamedAmount(BN(0));
        } else {
          const amt = stream.rate.mul(min - checkpoint.checkpointTime);
          setStreamedAmount(amt);
        }
      });
  }, [provider, checkpoint]);

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

  const startWithdraw = async ({ recipientAddress }: IWithdrawStreamInput) => {
    const latestBlockTime = await provider.getBlock('latest').then((b) => b.timestamp);
    const args = {
      recipient: recipientAddress,
      stream: checkpoint.stream,
      outCheckpointTime: latestBlockTime,
      currentTime: now(),
    };

    await withdrawStreamAsync(args);
    return true;
  };

  const simulateTest = async () => {
    setLoading(true);
    const { recipientAddress } = getValues();
    const latestBlockTime = await provider.getBlock('latest').then((b) => b.timestamp);
    const outCheckpointTime = Math.min(latestBlockTime, checkpoint.stream.stopTime);
    const args = {
      recipient: recipientAddress,
      stream: checkpoint.stream,
      outCheckpointTime,
      currentTime: now(),
    };
    await testAsync(args)
      .catch((err) => {
        logger.error(err);
      })
      .finally(() => setLoading(false));
  };

  const lastWithdrawTime = 0; // stream.startTime === stream.checkpointTime ? 0 : stream.checkpointTime;

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
            <Avatar src={instance.token.iconUrl} size="xs" />
            <Text fontWeight="bold">
              {formatUnits(streamedAmount, 18)} {instance.token.symbol}
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
