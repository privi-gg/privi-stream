import { Box, Button, Divider, Heading, Spinner, StackProps, Text, VStack } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FormInput } from 'components/common/form';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import logger from 'utils/logger';
import { isDev } from 'config/env';
import { useUI } from 'contexts/ui';
import { APP_NAME, SIGN_MESSAGE } from 'config/constants';
import { useSignMessage } from 'wagmi';
import { generateKeyPairFromSignature } from 'utils/stream';
import { ArrowRightIcon, EthereumIcon, KeyIcon } from 'components/icons';
import { useState } from 'react';

const schema = yup.object().shape({
  privateKey: yup
    .string()
    .required('Required')
    .matches(/^(0x)?([A-Fa-f0-9]{64})$/, 'Invalid Private Key'),
});

interface ILogInInput {
  privateKey: string;
}

// 0x17127c3cf67b647bbebc58a63911f35903bff485c4aa47295366c485cc6ab2bb
const defaultValues = {
  privateKey: isDev ? '0x1f84f832b1f8ca56b5173ca1840b06619a1f8678b90a52e6e5b16654112c393f' : '',
};

const AccountLogIn: React.FC<StackProps> = ({ ...props }) => {
  const { closeModal } = useUI();
  const [showLogInForm, setShowLogInForm] = useState(false);
  const { control, handleSubmit } = useForm<ILogInInput>({
    resolver: yupResolver(schema),
    defaultValues,
  });
  const { isLoading: isSignatureLoading, signMessageAsync } = useSignMessage({
    message: SIGN_MESSAGE,
  });
  const { logIn } = useShieldedAccount();

  const handleWalletLogin = async () => {
    const signature = await signMessageAsync();
    const keyPair = generateKeyPairFromSignature(signature);
    logIn(keyPair.privateKey);
    closeModal();
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
    <VStack alignItems="stretch" spacing={6} py={8} {...props}>
      <Heading textAlign="center" fontSize="xl">
        Log in to {APP_NAME}
      </Heading>
      <Divider />

      <Box py={4} px={8}>
        {showLogInForm ? (
          <VStack as="form" onSubmit={handleSubmit(submit)} alignItems="stretch" spacing={4}>
            <FormInput label="Enter Shielded Private Key" name="privateKey" control={control} />
            <Button type="submit">Log In</Button>
            <Button onClick={() => setShowLogInForm(false)} variant="ghost" colorScheme="gray">
              Back
            </Button>
          </VStack>
        ) : (
          <Box>
            <VStack alignSelf="stretch" py={8}>
              <Button
                size="lg"
                onClick={handleWalletLogin}
                leftIcon={<EthereumIcon />}
                rightIcon={
                  <Box ml={48}>
                    <ArrowRightIcon />
                  </Box>
                }
                colorScheme="gray"
                w="full"
              >
                MetaMask
              </Button>
              <Button
                size="lg"
                onClick={() => setShowLogInForm(true)}
                leftIcon={<KeyIcon color="green" />}
                rightIcon={
                  <Box ml={23}>
                    <ArrowRightIcon />
                  </Box>
                }
                colorScheme="gray"
                w="full"
              >
                Using Shielded Private Key
              </Button>
            </VStack>
            <Divider />

            <Box textAlign="center" pt={6}>
              New to Ethereum? Learn more about wallets.
            </Box>
          </Box>
        )}
      </Box>
    </VStack>
  );
};

export default AccountLogIn;
