import {
  Button,
  Heading,
  StackProps,
  Text,
  Textarea,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import { useRegisterAccount } from 'api/registerAccount';
import { useUI } from 'contexts/ui';
import { FC, useEffect, useState } from 'react';
import logger from 'utils/logger';
import { generateKeyPairFromSignature } from 'utils/stream';

const AccountRegister: FC<StackProps> = ({ ...props }) => {
  const { modalData, closeModal } = useUI();
  const [privateKey, setPrivateKey] = useState<string>('');
  const { hasCopied, onCopy } = useClipboard(privateKey);
  const { data: tx, error: txError, isLoading, isSuccess, write: register } = useRegisterAccount();

  useEffect(() => {
    if (!modalData?.signature) return;
    const keyPair = generateKeyPairFromSignature(modalData.signature);
    setPrivateKey(keyPair.privateKey);
  }, [modalData.signature]);

  useEffect(() => {
    if (isSuccess) closeModal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  const handleRegister = () => {
    if (!privateKey) return;
    const keyPair = generateKeyPairFromSignature(modalData.signature);

    const shieldedAddress = keyPair.address();
    logger.info(`Registering account:`, shieldedAddress);
    console.log({ register });

    register?.({
      recklesslySetUnpreparedArgs: [shieldedAddress],
    });
  };

  return (
    <VStack alignItems="stretch" spacing={6} {...props}>
      <Heading textAlign="center">Register Account</Heading>
      <VStack alignItems="stretch">
        <Text textAlign="center">Backup your private key and register your account on pool.</Text>
        <Textarea value={privateKey} noOfLines={10} readOnly />
        <Button alignSelf="flex-end" onClick={onCopy}>
          {hasCopied ? 'Copied!' : 'Copy'}
        </Button>
      </VStack>
      <Button onClick={handleRegister} isLoading={isLoading}>
        Register
      </Button>
    </VStack>
  );
};

export default AccountRegister;
