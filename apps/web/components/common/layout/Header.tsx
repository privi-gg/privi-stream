import { Button, Flex, FlexProps, HStack } from '@chakra-ui/react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { AccountRegisterButton } from 'components/account';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { useUI } from 'contexts/ui';
import Logo from '../Logo';

const Header: React.FC<FlexProps> = ({ ...props }) => {
  const { setModalViewAndOpen } = useUI();
  const { isLoggedIn, logOut } = useShieldedAccount();

  const handleLogIn = () => {
    if (isLoggedIn) {
      logOut();
      return;
    }
    setModalViewAndOpen('ACCOUNT_LOGIN');
  };
  return (
    <Flex p={4} justify="space-between" {...props}>
      <Logo />

      <HStack spacing={8}>
        <ConnectButton />
        <Button onClick={handleLogIn}>{!isLoggedIn ? `Log In` : `Log Out`}</Button>
        <AccountRegisterButton />
      </HStack>
    </Flex>
  );
};

export default Header;
