import { FC, useEffect, useState } from 'react';
import { Button, HStack, Spinner, StackProps, Text, VStack } from '@chakra-ui/react';
import { usePoolContract } from 'hooks/contracts';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import WithdrawStreamForm from './WithdrawStreamForm';
import StreamDetails from './StreamDetails';
import { Checkpoint, Stream } from '@privi-stream/common';
import { fetchReceiverCheckpoints, fetchReceiverStreams } from 'utils/pool';
import { useInstance } from 'contexts/instance';

const WithdrawStream: FC<StackProps> = ({ ...props }) => {
  const { instance } = useInstance();
  const poolContract = usePoolContract({ poolAddress: instance.pool });
  const [streams, setStreams] = useState<Stream[]>([]);
  const [checkpoint, setCheckpoint] = useState<Checkpoint | undefined>();
  const [isLoading, setLoading] = useState(false);
  const { shieldedWallet } = useShieldedAccount();

  useEffect(() => {
    if (streams.length > 0) {
      return;
    }
    setLoading(true);
    fetchReceiverStreams(shieldedWallet, poolContract)
      .then((streams) => {
        setStreams(streams);
        const stream = streams?.[streams.length - 1];
        if (!stream) return undefined;

        return fetchReceiverCheckpoints(poolContract, shieldedWallet, stream).then(
          (checkpoints) => {
            return checkpoints?.[0] || Checkpoint.zero(stream);
          },
        );
      })
      .then((checkpoint) => {
        setCheckpoint(checkpoint);
        console.log({ checkpoint });
      })
      .finally(() => setLoading(false));
  }, [streams.length, shieldedWallet, poolContract]);

  return (
    <VStack alignItems="stretch" spacing={10} w="full" {...props}>
      <VStack>
        {isLoading && <Spinner />}

        {!checkpoint && !isLoading && <Text>No stream found</Text>}
      </VStack>

      {checkpoint && (
        <VStack alignItems="stretch" spacing={16}>
          <HStack justify="space-around" alignItems="flex-start" spacing={8}>
            <StreamDetails checkpoint={checkpoint} flex={1} />
            <WithdrawStreamForm checkpoint={checkpoint} flex={1} />
          </HStack>
          <Button
            variant="ghost"
            colorScheme="gray"
            alignSelf="center"
            onClick={() => setStreams([])}
          >
            Back
          </Button>
        </VStack>
      )}
    </VStack>
  );
};

export default WithdrawStream;
