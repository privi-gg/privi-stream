import { FC, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  FormLabel,
  Heading,
  HStack,
  StackProps,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import dayjs from 'dayjs';
import logger from 'utils/logger';
import { useAccount, useProvider } from 'wagmi';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { isDev, testPrivateKey } from 'config/env';
import { useCreateStream } from 'api/createStream';
import { BN, formatUnitsRounded, parseEther } from 'utils/eth';
import { prepareCreate } from 'utils/proofs';
import { useRegistrarContract, useWTokenGatewayContract } from 'hooks/contracts';
import { getShieldedAccount } from 'api/getShieldedAccounts';
import { Wallet } from 'ethers';
import useInstance from 'hooks/instance';
import { FormRateInput, FormAddressInput, FormDateInput } from 'components/form';
import { ChevronRightIcon, ShieldCheckIcon, ArrowRightIcon } from 'components/icons';

interface ICreateSteamInput {
  rate: number;
  startTime: Date;
  stopTime: Date;
  receiverAddress: string;
}

const schema = yup.object().shape({
  rate: yup.number().typeError('Invalid number').positive('Invalid number').required('Required'),
  startTime: yup.string().required('Required'),
  stopTime: yup.string().required('Required'),
  receiverAddress: yup
    .string()
    .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
    .required('Required'),
});

const CreateStream: FC<StackProps> = ({ ...props }) => {
  const [isLoading, setLoading] = useState(false);
  const registrarContract = useRegistrarContract();
  const provider = useProvider();
  const { instanceAddress, instance } = useInstance();
  const wTokenGateway = useWTokenGatewayContract();
  const { address } = useAccount();
  const { keyPair: senderKeyPair } = useShieldedAccount();
  const { control, handleSubmit, watch, getValues } = useForm<ICreateSteamInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      rate: 0.00001,
      startTime: dayjs().toDate(),
      stopTime: dayjs().add(1, 'hour').toDate(),
      receiverAddress: isDev ? '0x3C6860DA6ED0939AE9f668476ca9B48Bcc4Ea939' : undefined,
    },
  });
  const { isSuccess, isError, writeAsync: createStream } = useCreateStream();

  const [rate, startTime, stopTime] = watch(['rate', 'startTime', 'stopTime']);

  const submit = (data: ICreateSteamInput) => {
    logger.info(`Submitted:`, data);
    setLoading(true);
    startCreation(data)
      .then(() => {
        logger.log(`Sent tx`);
      })
      .catch((err) => {
        logger.error(`Error:`, err);
        alert('Error occurred!');
      })
      .finally(() => setLoading(false));
  };

  const generateProofArgs = async (data: ICreateSteamInput) => {
    if (!address) {
      alert('Connect wallet first!');
      throw new Error('Not connected');
    }
    if (!senderKeyPair) {
      logger.error(`Not logged in!`);
      alert('Log in with your shielded key!');
      throw new Error('Not logged in');
    }

    const { keyPair: receiverKeyPair } = await getShieldedAccount(
      data.receiverAddress,
      registrarContract,
    );
    if (!receiverKeyPair) {
      alert('Receiver address is not registered!');
      throw new Error('Receiver not registered');
    }

    const { proofArgs, encryptedOutput } = await prepareCreate({
      ...data,
      keyPairs: {
        sender: senderKeyPair,
        receiver: receiverKeyPair,
      },
    });

    return { proofArgs, encryptedOutput };
  };

  const startCreation = async (data: ICreateSteamInput) => {
    const { proofArgs, encryptedOutput } = await generateProofArgs(data);

    await createStream?.({
      ...data,
      recklesslySetUnpreparedArgs: [instanceAddress, proofArgs, encryptedOutput],
      recklesslySetUnpreparedOverrides: {
        value: BN(proofArgs.publicAmount),
        gasLimit: BN(2_000_000),
      },
    });

    return true;
  };

  const simulateTest = async () => {
    setLoading(true);
    try {
      const data = getValues();
      const { proofArgs, encryptedOutput } = await generateProofArgs(data);
      const wallet = new Wallet(testPrivateKey, provider);

      logger.debug(`Simulating tx...`);
      const contract = wTokenGateway.connect(wallet);

      const tx = await contract.callStatic.create(instanceAddress, proofArgs, encryptedOutput, {
        value: BN(proofArgs.publicAmount),
        gasLimit: BN(2_000_000),
      });
      logger.debug(`Sent tx:`, tx);
    } catch (error) {
      logger.error(`Error:`, error);
    } finally {
      setLoading(false);
    }
  };

  let totalStreamAmount;
  try {
    const secondsDiff = dayjs(stopTime).diff(startTime, 'second');
    totalStreamAmount = formatUnitsRounded(parseEther(`${rate}`).mul(secondsDiff), 18);
  } catch (err) {
    totalStreamAmount = '0';
  }

  return (
    <VStack
      as="form"
      minW={600}
      alignItems="stretch"
      spacing={6}
      onSubmit={handleSubmit(submit)}
      bgColor="primary.50"
      p={8}
      rounded="md"
      {...props}
    >
      <FormRateInput label="Stream Rate" name="rate" control={control} />

      <FormAddressInput label="Receiver Address" name="receiverAddress" control={control} />

      <Box>
        <FormLabel px={4}>Choose timeframe</FormLabel>
        <HStack justify="space-between" alignItems="center" w="full">
          <FormDateInput name="startTime" control={control} w={250} />
          <Box px="8.2%">
            <ArrowRightIcon color="gray.400" size={16} />
          </Box>
          <FormDateInput name="stopTime" control={control} />
        </HStack>
      </Box>

      <VStack alignItems="stretch" bgColor="white" rounded="md" px={8} py={4} spacing={4}>
        <Heading fontSize="2xl" color="gray.600">
          Stream Summary
        </Heading>
        <HStack justify="space-between">
          <HStack alignItems="center">
            <ShieldCheckIcon color="green" size={22} />
            <Text color="gray.400">Total Stream Amount</Text>
          </HStack>
          <Text fontWeight="bold">{`${totalStreamAmount} ${instance.currency}`}</Text>
        </HStack>
        <HStack justify="space-between">
          <Text color="gray.400">Fee</Text>
          <Text fontWeight="bold">0% 0 {instance.currency}</Text>
        </HStack>
        <Divider />
        <HStack justify="space-between">
          <Text color="gray.400">Total Amount</Text>
          <Text fontWeight="bold">{`${totalStreamAmount} ${instance.currency}`}</Text>
        </HStack>
      </VStack>

      <Button
        type="submit"
        isLoading={isLoading}
        rightIcon={<ChevronRightIcon />}
        loadingText="Generating proof..."
      >
        Confirm
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
  );
};

export default CreateStream;
