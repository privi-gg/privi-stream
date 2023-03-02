import {
  Box,
  Button,
  Center,
  Circle,
  Divider,
  Heading,
  HStack,
  Icon,
  Skeleton,
  Spinner,
  StackProps,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import logger from 'utils/logger';
import { isDev, testShieldedPk1 } from 'config/env';
import { modalViews, useUI } from 'contexts/ui';
import { APP_NAME, SIGN_MESSAGE } from 'config/constants';
import { useSignMessage } from 'wagmi';
import { ArrowRightIcon, KeyIcon, PlusIcon, WalletIcon } from 'components/icons';
import { useState } from 'react';
import { FormTextInput } from 'components/form';
import { generateShieldedWalletFromSignature } from 'utils/pool';

const schema = yup.object().shape({
  privateKey: yup
    .string()
    .required('Required')
    .matches(/^(0x)?([A-Fa-f0-9]{64})$/, 'Invalid Private Key'),
});

interface ILogInInput {
  privateKey: string;
}

const defaultValues = {
  privateKey: isDev ? testShieldedPk1 : '',
};

const AccountLogIn: React.FC<StackProps> = ({ ...props }) => {
  const { closeModal, setModalViewAndOpen, setModalData } = useUI();
  const [showLogInForm, setShowLogInForm] = useState(false);
  const { control, handleSubmit } = useForm<ILogInInput>({
    resolver: yupResolver(schema),
    defaultValues,
  });
  const { isLoading: isSignatureLoading, signMessageAsync } = useSignMessage({
    message: SIGN_MESSAGE,
  });
  const { logIn, isLoading, isRegistered } = useShieldedAccount();

  const handleWalletLogin = async () => {
    const signature = await signMessageAsync();
    const keyPair = generateShieldedWalletFromSignature(signature);
    logIn(keyPair.privateKey);
    closeModal();
  };

  const handleSetUp = () => {
    setModalData({ promptSignature: true });
    setModalViewAndOpen(modalViews.ACCOUNT_REGISTER);
  };

  const submit = (data: any) => {
    logger.info('Form input:', data);
    if (data.privateKey) {
      logIn(data.privateKey);
      closeModal();
    }
  };

  if (isSignatureLoading) {
    return (
      <VStack alignItems="stretch" spacing={6} py={8} {...props}>
        <Heading textAlign="center" fontSize="xl">
          Log in to {APP_NAME}
        </Heading>
        <Divider />
        <VStack textAlign="center" spacing={4} py={4}>
          <Spinner size="lg" />
          <Text>Waiting for signature</Text>
          <Text color="gray.400">Sign message in your wallet</Text>
        </VStack>
      </VStack>
    );
  }

  return (
    <VStack alignItems="stretch" spacing={6} pt={8} {...props}>
      <Heading textAlign="center" fontSize="xl">
        Log in to {APP_NAME}
      </Heading>
      <Divider />

      <Box py={4} px={8}>
        {showLogInForm ? (
          <VStack as="form" onSubmit={handleSubmit(submit)} alignItems="stretch" spacing={4}>
            <FormTextInput label="Enter Shielded Private Key" name="privateKey" control={control} />
            <Button type="submit">Log In</Button>
            <Button onClick={() => setShowLogInForm(false)} variant="ghost" colorScheme="gray">
              Back
            </Button>
          </VStack>
        ) : (
          <Box>
            <VStack alignItems="stretch" alignSelf="stretch">
              <HStack
                as="button"
                justify="space-between"
                alignItems="center"
                rounded="md"
                p={4}
                bgColor="gray.100"
                _hover={{ bgColor: 'gray.200' }}
                onClick={handleWalletLogin}
              >
                <HStack spacing={4}>
                  <Circle bgColor="white" rounded="full" size={8}>
                    <Icon as={WalletIcon} color="blue.400" />
                  </Circle>
                  <VStack>
                    <Text fontWeight="bold">Use Wallet</Text>
                  </VStack>
                </HStack>
                <ArrowRightIcon />
              </HStack>
              <HStack
                as="button"
                justify="space-between"
                alignItems="center"
                rounded="md"
                p={4}
                bgColor="gray.100"
                _hover={{ bgColor: 'gray.200' }}
                onClick={() => setShowLogInForm(true)}
              >
                <HStack spacing={4}>
                  <Circle bgColor="white" rounded="full" size={8}>
                    <Icon as={KeyIcon} color="blue.400" />
                  </Circle>
                  <Text fontWeight="bold">Using Shielded Private Key</Text>
                </HStack>
                <ArrowRightIcon />
              </HStack>
            </VStack>

            {isLoading && <Skeleton h={10} w="full" rounded="md" mt={4} />}

            {!isRegistered && !isLoading && (
              <VStack alignItems="stretch" textAlign="center" pt={6} spacing={4}>
                <Center position="relative">
                  <Divider position="absolute" top={0} bottom={0} left={0} right={0} my="auto" />
                  <Text position="relative" textAlign="center" bg="white" px={2}>
                    Or set up a new account
                  </Text>
                </Center>
                <HStack
                  as="button"
                  justify="space-between"
                  alignItems="center"
                  rounded="md"
                  p={4}
                  bgColor="gray.100"
                  _hover={{ bgColor: 'gray.200' }}
                  onClick={handleSetUp}
                >
                  <HStack spacing={4}>
                    <Circle bgColor="white" rounded="full" size={8}>
                      <Icon as={PlusIcon} color="blue.400" />
                    </Circle>
                    <Text fontWeight="bold">Set Up Account</Text>
                  </HStack>
                  <ArrowRightIcon />
                </HStack>
              </VStack>
            )}

            <Box textAlign="center" pt={8} pb={4}>
              New to Ethereum? Learn more about wallets.
            </Box>
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export default AccountLogIn;
