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
import { isDev, testWallet2 } from 'config/env';
import { FormRateInput, FormAddressInput, FormDateInput, FormTextInput } from 'components/form';
import { ChevronRightIcon, ShieldCheckIcon, ArrowRightIcon } from 'components/icons';
import { usePoolCreateStreamNative } from 'api/pool';
import { useInstance } from 'contexts/instance';
import { formatUnitsRounded, parseEther, parseUnits } from 'privi-utils';
import useToast from 'hooks/toast';

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

const CreateStreamNative: FC<StackProps> = ({ ...props }) => {
  const [isLoading, setLoading] = useState(false);
  const { instance } = useInstance();
  const { showErrorToast } = useToast();
  const { isSuccess, createStreamAsync, testAsync } = usePoolCreateStreamNative({
    poolAddress: instance?.pool,
  });
  const { control, handleSubmit, watch, getValues } = useForm<ICreateSteamInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      rate: 0.00001,
      startTime: dayjs().toDate(),
      stopTime: dayjs().add(1, 'hour').toDate(),
      receiverAddress: isDev ? testWallet2?.address : undefined,
    },
  });

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
        showErrorToast({ description: err.message });
      })
      .finally(() => setLoading(false));
  };

  const startCreation = async (data: ICreateSteamInput) => {
    const rate = parseUnits(`${data.rate}`, instance.token.decimals);
    const startTime = dayjs(data.startTime).unix();
    const stopTime = dayjs(data.stopTime).unix();
    const receiverAddress = data.receiverAddress;

    await createStreamAsync?.({
      rate,
      startTime,
      stopTime,
      receiverAddress,
    });
  };

  const simulateTest = async () => {
    setLoading(true);
    const data = getValues();
    const rate = parseUnits(`${data.rate}`, instance.token.decimals);
    const startTime = dayjs(data.startTime).unix();
    const stopTime = dayjs(data.stopTime).unix();
    const receiverAddress = data.receiverAddress;

    await testAsync({
      rate,
      startTime,
      stopTime,
      receiverAddress,
    })
      .catch((err) => {
        logger.error(err);
      })
      .finally(() => setLoading(false));
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

      {/* <FormAddressInput label="Receiver Address" name="receiverAddress" control={control} /> */}
      <FormTextInput label="Receiver Address" name="receiverAddress" control={control} />

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
        <Heading fontSize="lg" color="gray.600">
          Stream Summary
        </Heading>
        <HStack justify="space-between">
          <HStack alignItems="center">
            <ShieldCheckIcon color="teal" size={22} />
            <Text color="gray.400">Total Stream Amount</Text>
          </HStack>
          <Text fontWeight="bold">{`${totalStreamAmount} ${instance.token.symbol}`}</Text>
        </HStack>
        <HStack justify="space-between">
          <Text color="gray.400">Fee</Text>
          <Text fontWeight="bold">0% 0 {instance.token.symbol}</Text>
        </HStack>
        <Divider />
        <HStack justify="space-between">
          <Text color="gray.400">Total Amount</Text>
          <Text fontWeight="bold">{`${totalStreamAmount} ${instance.token.symbol}`}</Text>
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

export default CreateStreamNative;
