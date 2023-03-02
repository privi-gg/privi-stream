import { FC } from 'react';
import { BigNumberish } from 'ethers';
import { TextProps, Text } from '@chakra-ui/react';
import { useInstance } from 'contexts/instance';
import { formatUnits } from 'privi-utils';
import { useGetTokenPrice } from 'api/token';

interface ITokenPriceTextProps extends TextProps {
  amount: BigNumberish;
}

const TokenPriceText: FC<ITokenPriceTextProps> = ({ amount, ...props }) => {
  const { instance } = useInstance();
  const { data: price } = useGetTokenPrice({ token: instance?.token?.name });

  const amountEth = formatUnits(amount, 18);
  const usdPrice = price ? Number(amountEth) * price : 0;

  return <Text {...props}>$ {usdPrice.toFixed(5)}</Text>;
};

export default TokenPriceText;
