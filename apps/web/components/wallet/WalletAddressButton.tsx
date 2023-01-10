import { FC } from 'react';
import { Circle, HStack, StackProps, Text } from '@chakra-ui/react';
import { useAccountModal } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { LogOutIcon } from 'components/icons';

const WalletAddressButton: FC<StackProps> = ({ ...props }) => {
  const { openAccountModal } = useAccountModal();
  const { address } = useAccount();
  return (
    <HStack
      as="button"
      rounded="md"
      px={4}
      py={2}
      bgColor="gray.100"
      _hover={{ bgColor: 'gray.200' }}
      onClick={() => openAccountModal?.()}
      {...props}
    >
      <Circle bgColor="green" size={2} />
      <Text>
        {address?.slice(0, 5)}...{address?.slice(-4)}
      </Text>
      <LogOutIcon />
    </HStack>
  );
};

export default WalletAddressButton;
