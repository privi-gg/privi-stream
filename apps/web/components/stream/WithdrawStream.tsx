import { FC, useState } from 'react';
import { Button, HStack, StackProps, VStack } from '@chakra-ui/react';
import { isDev } from 'config/env';
import { useRegistrarContract, useTsunamiContract } from 'hooks/contracts';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAccount } from 'wagmi';
import { Utxo } from '@tsunami/utils';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { scanStreamUTXOFor } from 'utils/stream';
import { getShieldedAccount } from 'api/getShieldedAccounts';
import WithdrawStreamDetail from './WithdrawStreamDetails';
import { useForm } from 'react-hook-form';
import { FormAddressInput } from 'components/form';
import { ChevronRightIcon } from 'components/icons';
import WithdrawStreamForm from './WithdrawStreamForm';

const defaultSenderValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';

const schema = yup.object().shape({
  senderAddress: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

const WithdrawStream: FC<StackProps> = ({ ...props }) => {
  const { control, handleSubmit, watch } = useForm<{ senderAddress: string }>({
    resolver: yupResolver(schema),
    defaultValues: {
      senderAddress: isDev ? defaultSenderValue : undefined,
    },
  });
  const [streamUtxo, setStreamUtxo] = useState<Utxo>();
  const [isLoading, setLoading] = useState(false);
  const registrarContract = useRegistrarContract();
  const tsunamiContract = useTsunamiContract();
  const { address } = useAccount();
  const { keyPair: receiverKeyPair } = useShieldedAccount();

  const [senderAddress] = watch(['senderAddress']);

  const fetchStream = async () => {
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
            label="Enter Stream Sender Address"
            name="senderAddress"
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
            <WithdrawStreamDetail stream={streamUtxo} flex={1} />
            <WithdrawStreamForm senderAddress={senderAddress} stream={streamUtxo} flex={1} />
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

export default WithdrawStream;
