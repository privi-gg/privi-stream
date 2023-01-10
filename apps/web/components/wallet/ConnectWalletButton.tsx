import { FC } from 'react';
import { Avatar, Button, ButtonProps, HStack, Text } from '@chakra-ui/react';
import { useChainModal, useConnectModal } from '@rainbow-me/rainbowkit';
import { useAccount, useNetwork } from 'wagmi';
import { ChevronDownIcon } from 'components/icons';

const ConnectWalletButton: FC<ButtonProps> = ({ ...props }) => {
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();
  const { isConnected } = useAccount();
  const { chain } = useNetwork();

  return (
    <>
      {!isConnected && (
        <Button onClick={openConnectModal} {...props}>
          Connect Wallet
        </Button>
      )}

      {isConnected && (
        <HStack
          as="button"
          rounded="md"
          px={4}
          py={2}
          bgColor="gray.100"
          _hover={{ bgColor: 'gray.200' }}
          onClick={openChainModal}
        >
          <Avatar size="xs" src={(chain as any)?.iconUrl} />
          <Text>{chain?.name}</Text>
          <ChevronDownIcon color="gray" />
        </HStack>
      )}
    </>
  );
};

export default ConnectWalletButton;
