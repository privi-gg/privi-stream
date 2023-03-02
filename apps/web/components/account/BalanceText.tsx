import { FC } from 'react';
import { TextProps, Text } from '@chakra-ui/react';
import { useAccount } from 'wagmi';
import { useGetTokenBalance } from 'api/token';
import { constants } from 'ethers';
import { Instance } from 'config/network';

interface IBalanceTextProps extends TextProps {
  label?: string;
  instance: Instance;
}

const BalanceText: FC<IBalanceTextProps> = ({ label, instance, ...props }) => {
  const { address } = useAccount();
  const { data } = useGetTokenBalance({ address, tokenAddress: constants.AddressZero });

  const balance = Number(data?.formatted || 0).toFixed(4);
  return (
    <Text color="gray.500" {...props}>
      {label}
      {balance} {instance.token.symbol}
    </Text>
  );
};

export default BalanceText;
