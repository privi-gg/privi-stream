import { FC, useState } from 'react';
import { Button, HStack, StackProps, Text, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { FormDatePicker, FormInput } from 'components/common/form';
import dayjs from 'dayjs';
import logger from 'utils/logger';
import { useAccount } from 'wagmi';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { isDev, rpcUrlGoerli } from 'config/env';
import { useCreateStream } from 'api/createStream';
import { BN } from 'utils/eth';
import { KeyPair } from '@tsunami/utils';
import { prepareProposal } from 'utils/proofs';
import { calculateTotalStreamAmount } from 'utils/stream';
import { useRegistrarContract } from 'hooks/contracts';
import { getShieldedAccount } from 'api/getShieldedAccounts';
import { Contract, providers, Wallet } from 'ethers';
import { tsunamiAddress } from 'config/network';
import tsunami from 'abi/tsunami.json';

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
  const { address } = useAccount();
  const { keyPair: senderKeyPair } = useShieldedAccount();
  const { control, handleSubmit, watch } = useForm<ICreateSteamInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      rate: 0.00001,
      startTime: dayjs().toDate(),
      stopTime: dayjs().add(1, 'hour').toDate(),
      receiverAddress: isDev ? '0x3C6860DA6ED0939AE9f668476ca9B48Bcc4Ea939' : undefined,
    },
  });
  const { isSuccess, isError, data, writeAsync: createStream } = useCreateStream();

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

  const startCreation = async (data: ICreateSteamInput) => {
    if (!address) {
      alert('Connect wallet first!');
      return;
    }
    if (!senderKeyPair) {
      logger.error(`Not logged in!`);
      alert('Log in with your shielded key!');
      return;
    }

    const { keyPair: receiverKeyPair } = await getShieldedAccount(
      data.receiverAddress,
      registrarContract,
    );
    if (!receiverKeyPair) {
      alert('Receiver address is not registered!');
      throw new Error('Receiver not registered');
    }

    const { proofArgs, encryptedOutput } = await prepareProposal({
      ...data,
      keyPairs: {
        sender: senderKeyPair,
        receiver: receiverKeyPair,
      },
    });

    console.log(`Proposal proof generated!`);

    await createStream?.({
      ...data,
      recklesslySetUnpreparedArgs: [proofArgs, encryptedOutput],
      recklesslySetUnpreparedOverrides: { value: BN(proofArgs.amount), gasLimit: BN(2_000_000) },
    });
    // await run(proofArgs, encryptedOutput);

    return true;
  };

  const runTest = async (args: any, eo: any) => {
    const provider = new providers.JsonRpcProvider(rpcUrlGoerli);
    const wallet = new Wallet(
      '0x125f637a1047221090a4e49d71b1d5a98208e44451478b20e4df05d84946e7d3',
      provider,
    );
    console.log({ addr: wallet.address });

    console.log('Simulating');

    const pool = new Contract(tsunamiAddress, tsunami.abi, wallet);

    const tx = await pool.callStatic.create(args, eo, {
      value: BN(args.amount),
      gasLimit: 2_000_000,
    });
    console.log('Sent tx');
    console.log(tx);
  };

  return (
    <VStack as="form" alignItems="stretch" spacing={10} onSubmit={handleSubmit(submit)} {...props}>
      <HStack alignItems="end" spacing={2}>
        <FormInput label="Stream Rate" name="rate" control={control} />
        <Text pb={4}>ETH/sec</Text>
      </HStack>

      <FormInput label="Receiver Address" name="receiverAddress" control={control} />

      <HStack justify="space-around" w="full">
        <FormDatePicker label="Start At" name="startTime" control={control} />
        <FormDatePicker label="End At" name="stopTime" control={control} />
      </HStack>

      <Text textAlign="center" fontWeight="bold" fontSize="xl">
        Stream Amount: {calculateTotalStreamAmount(rate, startTime, stopTime)} ETH
      </Text>

      <Button type="submit" isLoading={isLoading} loadingText="Generating proof...">
        Confirm
      </Button>
    </VStack>
  );
};

export default CreateStream;
