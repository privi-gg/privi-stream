import { FC } from 'react';
import {
  Button,
  ButtonProps,
  Circle,
  HStack,
  IconButton,
  Link,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import { useAccount, useDisconnect } from 'wagmi';
import { ArrowUpRightIcon, ChevronDownIcon, CopyIcon, LogOutIcon } from 'components/icons';
import { formatDisplayAddress, getBlockExplorerAddressUrl } from 'privi-utils';
import { useShieldedAccount } from 'contexts/shieldedAccount';
import { useInstance } from 'contexts/instance';

const ConnectedAddressButton: FC<ButtonProps> = ({ ...props }) => {
  const { address } = useAccount();
  const { onCopy } = useClipboard(address || '');
  const { logOut } = useShieldedAccount();
  const { disconnectAsync } = useDisconnect();
  const { explorerUrl } = useInstance();

  const handleDisconnect = () => {
    disconnectAsync?.().then(() => logOut());
  };

  const addressLink = getBlockExplorerAddressUrl(address as any, explorerUrl);

  return (
    <Popover placement="bottom-start">
      <PopoverTrigger>
        <Button
          colorScheme="gray"
          leftIcon={<Circle bgColor="green" size={2} />}
          rightIcon={<ChevronDownIcon color="gray" />}
          fontWeight="regular"
          {...props}
        >
          {address?.slice(0, 5)}...{address?.slice(-4)}
        </Button>
      </PopoverTrigger>
      <PopoverContent minW="sm" shadow="lg" borderColor="white">
        <PopoverBody>
          <VStack alignItems="stretch" spacing={4} p={2}>
            <HStack alignItems="center">
              <Circle bgColor="green.400" size={2} />
              <Text>Connected</Text>
            </HStack>
            <HStack justify="space-between">
              <Text fontWeight="bold">{formatDisplayAddress(address || '')}</Text>
              <HStack>
                <IconButton
                  variant="ghost"
                  colorScheme="gray"
                  size="sm"
                  icon={<CopyIcon />}
                  aria-label="copy address"
                  onClick={() => onCopy()}
                />

                <Link target="_blank" href={addressLink}>
                  <IconButton
                    variant="ghost"
                    colorScheme="gray"
                    size="md"
                    icon={<ArrowUpRightIcon />}
                    aria-label="copy address"
                  />
                </Link>
              </HStack>
            </HStack>

            <Button
              rightIcon={<LogOutIcon />}
              variant="outline"
              colorScheme="red"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default ConnectedAddressButton;
