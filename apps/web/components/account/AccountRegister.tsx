import { FC, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Checkbox,
  Divider,
  Heading,
  HStack,
  StackProps,
  Text,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import { useRegisterAccount } from 'api/account';
import { CopyIcon, DownloadIcon } from 'components/icons';
import { APP_NAME, SIGN_MESSAGE } from 'config/constants';
import { useUI } from 'contexts/ui';
import { downloadTextFile } from 'utils/file';
import logger from 'utils/logger';
import { generateShieldedWalletFromSignature } from 'utils/pool';
import { useAccount, useSignMessage } from 'wagmi';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { ShieldedWallet } from '@privi-stream/common';

const AccountRegister: FC<StackProps> = ({ ...props }) => {
  const { closeModal } = useUI();
  const [privateKey, setPrivateKey] = useState<string>('');
  const { hasCopied, onCopy, setValue } = useClipboard(privateKey);
  const [hasAgreed, setHasAgreed] = useState(false);
  const { address } = useAccount();
  const { logIn } = useShieldedAccount();
  const {
    isError: isSignError,
    isLoading: isSignLoading,
    signMessageAsync,
  } = useSignMessage({ message: SIGN_MESSAGE });
  const {
    isError: isRegisterError,
    isLoading: isRegisterLoading,
    isSuccess: isRegisterSuccess,
    writeAsync: register,
  } = useRegisterAccount();

  useEffect(() => {
    if (isRegisterSuccess) {
      logIn(privateKey);
      closeModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRegisterSuccess]);

  const handleRegister = async () => {
    if (!privateKey) return;
    const keyPair = new ShieldedWallet(privateKey);

    const shieldedAddress = keyPair.address();
    logger.info(`Registering account:`, shieldedAddress);

    await register?.({
      recklesslySetUnpreparedArgs: [shieldedAddress],
    });
  };

  const handleSignMessage = async () => {
    const signature = await signMessageAsync();
    const keyPair = generateShieldedWalletFromSignature(signature);
    setValue(keyPair.privateKey);
    setPrivateKey(keyPair.privateKey);
  };

  const downloadKey = () => {
    if (!privateKey) return;
    try {
      const filename = `${(address || '')?.slice(0, 7)}-shielded-private-key`;
      downloadTextFile({ content: privateKey, filename });
    } catch (error) {
      logger.error(error);
    }
  };

  if (!privateKey) {
    return (
      <VStack alignItems="stretch" spacing={6} py={8} {...props}>
        <Heading textAlign="center" fontSize="xl">
          Generate Shielded Private Key
        </Heading>

        <Divider />

        <Box px={8}>
          <Text color="gray.500" textAlign="center" pb={4}>
            Generate your shielded private key from your connected wallet. Your shielded private is
            sensitive and used to access & spend your shielded funds.
          </Text>

          {isSignError && (
            <Text
              color="orange.400"
              textAlign="center"
              p={1}
              borderColor="orange.400"
              borderWidth={1}
              rounded="md"
              fontSize="sm"
              mb={4}
            >
              Error getting signature. Try Again!
            </Text>
          )}

          <Button w="full" onClick={handleSignMessage} isLoading={isSignLoading}>
            Generate Key
          </Button>
        </Box>
      </VStack>
    );
  }

  return (
    <VStack alignItems="stretch" spacing={6} py={8} {...props}>
      <Heading textAlign="center" fontSize="xl">
        Back up Shielded Private Key
      </Heading>
      <Divider />

      <Box px={8}>
        <VStack alignItems="stretch">
          <Text color="gray.500" textAlign="center">
            To access your account in the future, it is important to back up your shielded key. DO
            NOT reveal your key to anyone, including the {APP_NAME} developers.
          </Text>
          <HStack justify="space-around" py={4} spacing={4}>
            <Button leftIcon={<DownloadIcon />} flex={1} onClick={downloadKey}>
              Download
            </Button>
            <Button
              leftIcon={<CopyIcon />}
              colorScheme="gray"
              alignSelf="flex-end"
              variant="outline"
              onClick={onCopy}
              flex={1}
            >
              {hasCopied ? 'Copied!' : 'Copy'}
            </Button>
          </HStack>
        </VStack>

        <Box pt={2} pb={6}>
          <Checkbox isChecked={hasAgreed} onChange={() => setHasAgreed(!hasAgreed)}>
            I backed up my Shielded Private Key
          </Checkbox>
        </Box>

        {isRegisterError && (
          <Text
            color="orange.400"
            textAlign="center"
            p={1}
            borderColor="orange.400"
            borderWidth={1}
            rounded="md"
            fontSize="sm"
            mb={4}
          >
            Error setting up account. Try Again!
          </Text>
        )}

        <Button
          w="full"
          onClick={handleRegister}
          isLoading={isRegisterLoading}
          isDisabled={!hasAgreed}
          alignSelf="stretch"
        >
          Set up Account
        </Button>
      </Box>
    </VStack>
  );
};

export default AccountRegister;
