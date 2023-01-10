import { FC } from 'react';
import { TextProps, Text } from '@chakra-ui/react';
import { useGetTokenPrice } from 'api/getTokenPrice';
import useInstance from 'hooks/instance';
import { BigNumberish } from 'ethers';
import { formatUnits } from 'utils/eth';

interface ITokenPriceTextProps extends TextProps {
  amount: BigNumberish;
}

const TokenPriceText: FC<ITokenPriceTextProps> = ({ amount, ...props }) => {
  const { token } = useInstance();
  const { data: price } = useGetTokenPrice({ token });

  const amountEth = formatUnits(amount, 18);
  const usdPrice = price ? Number(amountEth) * price : 0;

  return <Text {...props}>$ {usdPrice.toFixed(5)}</Text>;
};

export default TokenPriceText;
