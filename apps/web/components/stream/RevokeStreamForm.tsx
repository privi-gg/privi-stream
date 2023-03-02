// import { FC, useEffect, useState } from 'react';
// import { Avatar, Button, HStack, StackProps, Text, VStack } from '@chakra-ui/react';
// import * as yup from 'yup';
// import { yupResolver } from '@hookform/resolvers/yup';
// import { useAccount, useProvider } from 'wagmi';
// import { Utxo } from '@privi-stream/common';
// import { isDev, testPrivateKey1 } from 'config/env';
// import { FormAddressInput, FormDateInput } from 'components/form';
// import { useForm } from 'react-hook-form';
// import {
//   useRegistrarContract,
//   useTsunamiContract,
//   useWTokenGatewayContract,
// } from 'hooks/contracts';
// import useInstance from 'hooks/instance';
// import { useShieldedAccount } from 'contexts/shieldedAccount';
// import { getShieldedAccount } from 'api/getShieldedAccounts';
// import { ChevronRightIcon } from 'components/icons';
// import logger from 'utils/logger';
// import { BN, latestBlockTimestamp, isValidAddress, formatUnitsRounded } from 'utils/eth';
// import { prepareRevoke } from 'utils/proofs';
// import { Wallet } from 'ethers';
// import { formatDate, now } from 'utils/datetime';
// import { TokenPriceText } from 'components/common';
// import { useRevokeStream } from 'api/revokeStream';
// import { useGetBlock } from 'api/pool/getBlock';
// import { REVOKE_TIME_DELTA } from 'config/constants';
// import { getRevokeClaimableAmount } from 'utils/stream';
// import dayjs from 'dayjs';

// const defaultRecipientValue = isDev ? '0x80630fBf405eD070F10c8fFE8E9A83C60736a770' : '';

// interface IRevokeStreamInput {
//   recipientAddress: string;
//   newStopTime: Date;
// }

// interface IRevokeStreamFormProps extends StackProps {
//   stream: Utxo;
//   receiverAddress: string;
// }

// const schema = yup.object().shape({
//   recipientAddress: yup
//     .string()
//     .matches(/^(0x)?([A-Fa-f0-9]{40})$/, 'Invalid Address')
//     .required('Required'),
//   newStopTime: yup.string().required('Required'),
// });

// const RevokeStreamForm: FC<IRevokeStreamFormProps> = ({ stream, receiverAddress, ...props }) => {
//   const [isLoading, setLoading] = useState(false);
//   const [newStopTime, setNewStopTime] = useState(0);
//   const provider = useProvider();
//   const { address } = useAccount();
//   const { data: latestBlock } = useGetBlock('latest');
//   const registrarContract = useRegistrarContract();
//   const { instanceAddress, instance } = useInstance();
//   const tsunamiContract = useTsunamiContract();
//   const wTokenGateway = useWTokenGatewayContract();
//   const { keyPair: senderKeyPair } = useShieldedAccount();
//   const { isSuccess, isError, writeAsync: revokeStream } = useRevokeStream();
//   const { control, handleSubmit, getValues } = useForm<IRevokeStreamInput>({
//     resolver: yupResolver(schema),
//     defaultValues: {
//       recipientAddress: isDev ? defaultRecipientValue : undefined,
//       newStopTime: dayjs().add(30, 'minute').toDate(),
//     },
//   });

//   useEffect(() => {
//     if (!stream) return;

//     const currentTime = latestBlock?.timestamp || now();
//     const newStopTime = currentTime + REVOKE_TIME_DELTA;

//     if (newStopTime >= stream.stopTime) {
//       setNewStopTime(-1);
//     } else {
//       setNewStopTime(newStopTime);
//     }
//   }, [stream, latestBlock?.timestamp]);

//   const submit = (data: IRevokeStreamInput) => {
//     setLoading(true);
//     startRevoke(data)
//       .then(() => {
//         logger.log(`Sent tx`);
//       })
//       .catch((err) => {
//         logger.error(`Error:`, err);
//         alert('Error occurred!');
//       })
//       .finally(() => setLoading(false));
//   };

//   const generateProofArgs = async ({ recipientAddress, newStopTime }: IRevokeStreamInput) => {
//     if (!address) {
//       alert('Connect wallet first!');
//       throw new Error('Not connected');
//     }

//     if (!isValidAddress(recipientAddress)) {
//       alert('Invalid fund recipient address!');
//       throw new Error('Invalid recipient address');
//     }

//     if (!senderKeyPair) {
//       logger.error(`Not logged in!`);
//       alert('Log in with your shielded key!');
//       throw new Error('Not logged in');
//     }

//     const { keyPair: receiverKeyPair } = await getShieldedAccount(
//       receiverAddress,
//       registrarContract,
//     );
//     if (!receiverKeyPair) {
//       alert('Receiver address is not registered!');
//       throw new Error('Receiver not registered');
//     }

//     const { proofArgs, extData } = await prepareRevoke({
//       tsunami: tsunamiContract,
//       input: stream,
//       keyPairs: {
//         sender: senderKeyPair,
//         receiver: receiverKeyPair,
//       },
//       newStopTime: dayjs(newStopTime).unix(),
//       recipient: wTokenGateway.address,
//     });

//     return { proofArgs, extData };
//   };

//   const startRevoke = async (data: IRevokeStreamInput) => {
//     const { proofArgs, extData } = await generateProofArgs(data);

//     await revokeStream?.({
//       ...data,
//       recklesslySetUnpreparedArgs: [instanceAddress, receiverAddress, proofArgs, extData],
//       recklesslySetUnpreparedOverrides: { gasLimit: BN(2_000_000) },
//     });

//     return true;
//   };

//   const simulateTest = async () => {
//     setLoading(true);
//     const data = getValues();
//     try {
//       const { proofArgs, extData } = await generateProofArgs(data);
//       const wallet = new Wallet(testPrivateKey1, provider);

//       logger.debug(`Simulating tx...`);
//       const contract = wTokenGateway.connect(wallet);

//       const tx = await contract.callStatic.revoke(
//         instanceAddress,
//         data.recipientAddress,
//         proofArgs,
//         extData,
//         {
//           gasLimit: BN(2_000_000),
//         },
//       );
//       logger.debug(`Sent tx:`, tx);
//     } catch (error) {
//       logger.error(`Error:`, error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const lastWithdrawTime = stream.startTime === stream.checkpointTime ? 0 : stream.checkpointTime;
//   const isTooLateToRevoke = newStopTime < 0;
//   const claimableAmount = isTooLateToRevoke ? BN(0) : getRevokeClaimableAmount(stream, newStopTime);

//   return (
//     <VStack bgColor="primary.50" p={8} alignItems="stretch" rounded="md" spacing={8} {...props}>
//       <VStack alignItems="stretch" spacing={8}>
//         <HStack justify="space-between">
//           <Text color="gray.500">Last Withdraw Time</Text>
//           {lastWithdrawTime > 0 ? (
//             <Text fontWeight="bold">{formatDate(lastWithdrawTime * 1000)}</Text>
//           ) : (
//             <Text fontSize="sm" fontWeight="bold" p={2} rounded="3xl" bg="gray.300">
//               Haven&apos;t withdrawn anything yet
//             </Text>
//           )}
//         </HStack>
//         <HStack justify="space-between">
//           <Text color="gray.500">You can revoke & claim</Text>
//           <HStack alignItems="center">
//             <TokenPriceText amount={claimableAmount} fontWeight="bold" color="gray.400" />
//             <Avatar src={instance.iconUrl} size="xs" />
//             <Text fontWeight="bold">
//               {formatUnitsRounded(claimableAmount, 18)} {instance.currency}
//             </Text>
//           </HStack>
//         </HStack>
//       </VStack>
//       <VStack as="form" alignItems="stretch" spacing={10} onSubmit={handleSubmit(submit)}>
//         <FormDateInput label="Stop At" name="newStopTime" control={control} />

//         <FormAddressInput
//           label="Fund's Recipient Address"
//           name="recipientAddress"
//           control={control}
//         />
//         <Button
//           type="submit"
//           rightIcon={<ChevronRightIcon />}
//           disabled={isTooLateToRevoke}
//           isLoading={isLoading}
//         >
//           {!isTooLateToRevoke ? `Revoke Stream` : `Can't revoke now`}
//         </Button>
//         {isDev && (
//           <Button colorScheme="orange" isLoading={isLoading} onClick={simulateTest}>
//             Test
//           </Button>
//         )}
//       </VStack>
//     </VStack>
//   );
// };

// export default RevokeStreamForm;
