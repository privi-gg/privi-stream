import { FC } from 'react';
import {
  Avatar,
  Button,
  ButtonProps,
  Circle,
  HStack,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { ChevronDownIcon } from 'components/icons';

const ConnectedChainButton: FC<ButtonProps> = ({ ...props }) => {
  const { chain: connectedChain } = useNetwork();
  const { chains, switchNetwork } = useSwitchNetwork();

  const handleSwitchNetwork = (id: number) => {
    if (!id) return;
    switchNetwork?.(id);
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Button
          colorScheme="gray"
          leftIcon={<Avatar size="xs" src={(connectedChain as any)?.iconUrl} />}
          rightIcon={<ChevronDownIcon color="gray" />}
          {...props}
        >
          {connectedChain?.name}
        </Button>
      </PopoverTrigger>
      <PopoverContent shadow="lg" borderColor="white">
        <PopoverBody>
          <VStack alignItems="stretch" spacing={1} p={0}>
            {chains?.map((chain: any) => (
              <HStack
                w="full"
                p={2}
                rounded="md"
                justify="space-between"
                _hover={{ bgColor: 'gray.200', cursor: 'pointer' }}
                onClick={() => handleSwitchNetwork(chain?.id)}
              >
                <HStack>
                  <Avatar src={chain?.iconUrl} size="xs" />
                  <Text>{chain?.name}</Text>
                </HStack>
                {connectedChain?.id === chain?.id && (
                  <HStack alignItems="center" ml="auto">
                    <Circle bgColor="green.400" size={2} />
                    <Text>Connected</Text>
                  </HStack>
                )}
              </HStack>
            ))}
          </VStack>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default ConnectedChainButton;
