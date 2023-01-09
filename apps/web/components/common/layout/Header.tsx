import { useRouter } from 'next/router';
import { Button, Flex, FlexProps, HStack, Text } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AccountRegisterButton } from 'components/account';
import { APP_NAME, ROUTES } from 'config/constants';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { useUI } from 'contexts/ui';
import Link from '../Link';
import Logo from '../Logo';

const Header: React.FC<FlexProps> = ({ ...props }) => {
  const { setModalViewAndOpen } = useUI();
  const { isLoggedIn, logOut } = useShieldedAccount();

  const router = useRouter();

  const handleLogIn = () => {
    if (isLoggedIn) {
      logOut();
      return;
    }
    setModalViewAndOpen('ACCOUNT_LOGIN');
  };
  return (
    <Flex px={16} py={4} justify="space-between" {...props}>
      <HStack spacing={4}>
        <HStack spacing={4} onClick={() => router.push(ROUTES.HOME)} cursor="pointer">
          <Logo />
          <Text color="primary.500" fontSize="2xl" fontWeight="bold">
            {APP_NAME}
          </Text>
        </HStack>
        <HStack spacing={8}>
          <Link href={ROUTES.CREATE}>Create</Link>
          <Link href={ROUTES.WITHDRAW}>Withdraw</Link>
          <Link href={ROUTES.REVOKE}>Revoke</Link>
        </HStack>
      </HStack>

      <HStack spacing={8}>
        <ConnectButton />
        <Button colorScheme="gray" onClick={handleLogIn}>
          {!isLoggedIn ? `Log In` : `Log Out`}
        </Button>
        <AccountRegisterButton />
      </HStack>
    </Flex>
  );
};

export default Header;
