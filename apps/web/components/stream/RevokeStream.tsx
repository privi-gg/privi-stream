import { FC, useState } from 'react';
import { Button, HStack, StackProps, VStack } from '@chakra-ui/react';
import { isDev } from 'config/env';
import {
  useRegistrarContract,
  useTsunamiContract,
  useWTokenGatewayContract,
} from 'hooks/contracts';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAccount, useProvider } from 'wagmi';
import { Utxo } from '@privi-stream/common';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { scanStreamUTXOFor } from 'utils/stream';
import { getShieldedAccount } from 'api/getShieldedAccounts';
import useInstance from 'hooks/instance';
import { FormAddressInput } from 'components/form';
import RevokeStreamForm from './RevokeStreamForm';
import { useForm } from 'react-hook-form';
import { ChevronRightIcon } from 'components/icons';
import StreamDetails from './StreamDetails';

const defaultReceiverValue = isDev ? '0x3C6860DA6ED0939AE9f668476ca9B48Bcc4Ea939' : '';

const schema = yup.object().shape({
  receiverAddress: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

const RevokeStream: FC<StackProps> = ({ ...props }) => {
  const { control, handleSubmit, watch } = useForm<{ receiverAddress: string }>({
    resolver: yupResolver(schema),
    defaultValues: {
      receiverAddress: isDev ? defaultReceiverValue : undefined,
    },
  });
  const [streamUtxo, setStreamUtxo] = useState<Utxo>();
  const [isLoading, setLoading] = useState(false);
  const registrarContract = useRegistrarContract();
  const tsunamiContract = useTsunamiContract();
  const { address } = useAccount();
  const { keyPair: senderKeyPair } = useShieldedAccount();

  const [receiverAddress] = watch(['receiverAddress']);

  const fetchStream = async () => {
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

  return (
    <VStack alignItems="stretch" spacing={10} w="full" {...props}>
      {!streamUtxo && (
        <VStack
          as="form"
          w={600}
          alignItems="stretch"
          mx="auto"
          spacing={8}
          bgColor="primary.50"
          p={8}
          rounded="md"
        >
          <FormAddressInput
            label="Enter Stream Receiver Address"
            name="receiverAddress"
            control={control}
          />
          <Button
            type="submit"
            onClick={fetchStream}
            rightIcon={<ChevronRightIcon />}
            isLoading={isLoading}
          >
            Fetch Stream
          </Button>
        </VStack>
      )}
      {streamUtxo && (
        <VStack alignItems="stretch" spacing={16}>
          <HStack justify="space-around" alignItems="flex-start" spacing={8}>
            <StreamDetails stream={streamUtxo} flex={1} />
            <RevokeStreamForm receiverAddress={receiverAddress} stream={streamUtxo} flex={1} />
          </HStack>
          <Button
            variant="ghost"
            colorScheme="gray"
            alignSelf="center"
            onClick={() => setStreamUtxo(undefined)}
          >
            Back
          </Button>
        </VStack>
      )}
    </VStack>
  );
};

export default RevokeStream;
