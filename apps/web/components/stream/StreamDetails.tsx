import { FC, useEffect, useState } from 'react';
import { Avatar, Box, HStack, Progress, StackProps, Text, VStack } from '@chakra-ui/react';
import dayjs from 'dayjs';
import { useProvider } from 'wagmi';
import { CheckCircleIcon, TimeIcon } from 'components/icons';
import { formatTimeDuration } from 'utils/datetime';
import { TokenPriceText } from 'components/common';
import { Checkpoint, Stream } from '@privi-stream/common';
import { useInstance } from 'contexts/instance';
import { BN, formatEther, formatUnits } from 'privi-utils';

interface IStreamDetailsProps extends StackProps {
  checkpoint: Checkpoint;
}

const StreamDetails: FC<IStreamDetailsProps> = ({ checkpoint, ...props }) => {
  const provider = useProvider();
  const { instance } = useInstance();
  const [progress, setProgress] = useState(0);
  const [streamedAmount, setStreamedAmount] = useState(BN(0));
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const stream = checkpoint?.stream;
    if (!stream) return;

    provider
      .getBlock('latest')
      .then((b) => b.timestamp)
      .then((currentTime) => {
        const min = Math.min(currentTime, stream.stopTime);
        setTimeLeft(stream.stopTime - min);

        if (currentTime <= checkpoint.checkpointTime) {
          setStreamedAmount(BN(0));
        } else {
          const amt = stream.rate.mul(min - checkpoint.checkpointTime);
          setStreamedAmount(amt);
        }

        if (currentTime >= stream.stopTime) {
          setProgress(100);
        } else {
          const progress = Math.ceil(
            ((currentTime - stream.startTime) * 100) / (stream.stopTime - stream.startTime),
          );
          setProgress(progress);
        }
      });
  }, [checkpoint, provider]);

  const stream = checkpoint?.stream;
  const amount = formatEther(stream.amount || 0);
  const rate = formatEther(stream.rate || 0);
  const startTime = dayjs(stream.startTime * 1000).format('DD MMM hh:mm A');
  const stopTime = dayjs(stream.stopTime * 1000).format('DD MMM hh:mm A');
  const isStreamComplete = timeLeft <= 0;

  return (
    <VStack alignItems="stretch" p={8} spacing={6} {...props}>
      <HStack justify="space-between">
        <HStack>
          <Text color="gray.500">Streamed:</Text>
          <Text fontWeight="bold">{progress} %</Text>
        </HStack>
        <HStack alignItems="center">
          {isStreamComplete ? <CheckCircleIcon color="green" size={16} /> : <TimeIcon size={16} />}
          <Text fontSize="sm" fontWeight="bold" textTransform="uppercase">
            {isStreamComplete
              ? 'Stream completed'
              : `${formatTimeDuration(timeLeft)} left to complete stream`}
          </Text>
        </HStack>
      </HStack>

      <HStack w="full" justify="space-between" p={4} bgColor="gray.100" rounded="3xl" spacing={6}>
        <Progress
          value={progress}
          size="sm"
          rounded="md"
          colorScheme="green"
          bgColor="gray.300"
          flex={1}
        />
        <Box
          fontSize="sm"
          fontWeight="bold"
          color="primary.500"
          bgColor="primary.100"
          rounded="2xl"
          p={1}
        >
          {formatUnits(streamedAmount, 18)} / {amount} {instance.token.symbol}
        </Box>
      </HStack>

      <VStack alignItems="stretch" spacing={8}>
        <HStack justify="space-between">
          <Text color="gray.500">Stream Rate</Text>
          <HStack alignItems="center">
            <TokenPriceText amount={stream.rate} fontWeight="bold" color="gray.500" />

            <Text fontWeight="bold">{rate}</Text>
            <Avatar src={instance.token.iconUrl} size="xs" />
            <Text fontWeight="bold">{instance.token.symbol} / sec</Text>
          </HStack>
        </HStack>

        <HStack justify="space-between">
          <Text color="gray.500">Start Time</Text>
          <Text fontWeight="bold">{startTime}</Text>
        </HStack>

        <HStack justify="space-between">
          <Text color="gray.500">Stop Time</Text>
          <Text fontWeight="bold">{stopTime}</Text>
        </HStack>
      </VStack>
    </VStack>
  );
};

export default StreamDetails;
