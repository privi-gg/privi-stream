import { FC } from 'react';
import { Button, ButtonProps } from '@chakra-ui/react';
import { useConnectModal } from '@rainbow-me/rainbowkit';

const ConnectWalletButton: FC<ButtonProps> = ({ ...props }) => {
  const { openConnectModal } = useConnectModal();

  return (
    <Button onClick={openConnectModal} {...props}>
      Connect Wallet
    </Button>
  );
};

export default ConnectWalletButton;
