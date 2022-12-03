import {
  Button,
  Heading,
  Spinner,
  StackProps,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FormInput } from 'components/common/form';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import logger from 'utils/logger';
import { isDev } from 'config/env';
import { useUI } from 'contexts/ui';
import { SIGN_MESSAGE } from 'config/constants';
import { useSignMessage } from 'wagmi';
import { generateKeyPairFromSignature } from 'utils/stream';
import { ErrorIcon } from 'components/icons';

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
  const { control, handleSubmit } = useForm<ILogInInput>({
    resolver: yupResolver(schema),
    defaultValues,
  });
  const { isError, isLoading, signMessageAsync } = useSignMessage({ message: SIGN_MESSAGE });
  const { logIn } = useShieldedAccount();

  const handleWalletLogin = async () => {
    const signature = await signMessageAsync();
    const keyPair = generateKeyPairFromSignature(signature);
    logIn(keyPair.privateKey);
    closeModal();
  };

  const handleTabChange = (idx: number) => {
    if (idx !== 1) return;
    handleWalletLogin();
  };

  const submit = (data: any) => {
    logger.info('Form input:', data);
    if (data.privateKey) {
      logIn(data.privateKey);
      closeModal();
    }
  };

  return (
    <VStack alignItems="stretch" spacing={6} {...props}>
      <Heading textAlign="center">Log In</Heading>
      <Tabs variant="soft-rounded" isFitted onChange={handleTabChange}>
        <TabList>
          <Tab>Shielded Private Key</Tab>
          <Tab>Use Wallet</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <VStack
              as="form"
              onSubmit={handleSubmit(submit)}
              alignItems="stretch"
              spacing={6}
              py={4}
            >
              <FormInput label="Shielded Private Key" name="privateKey" control={control} />
              <Button type="submit">Log In</Button>
            </VStack>
          </TabPanel>
          <TabPanel>
            <VStack py={8} spacing={4}>
              {isLoading && <Spinner />}
              {isError && (
                <Button
                  colorScheme="red"
                  variant="ghost"
                  leftIcon={<ErrorIcon />}
                  onClick={handleWalletLogin}
                >
                  Retry
                </Button>
              )}
              <Text fontWeight="bold" textAlign="center">
                Sign message in your Wallet!
              </Text>
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};

export default AccountLogIn;
