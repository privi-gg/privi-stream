import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const apiBaseUrl = 'https://api.coingecko.com/api/v3';

const tokenIds: Record<string, string> = {
  wxdai: 'xdai',
  xdai: 'xdai',
  eth: 'ethereum',
  weth: 'ethereum',
  matic: 'matic-network',
  wmatic: 'matic-network',
  usdt: 'tether',
};

interface ITokenPriceInput {
  token?: string;
}

export const getTokenPrice = async ({ token }: ITokenPriceInput) => {
  const tokenId = tokenIds[token as string];
  return axios
    .get(`${apiBaseUrl}/simple/price?ids=${tokenId}&vs_currencies=usd`)
    .then((res) => res.data)
    .then((data) => data[tokenId].usd);
};

export const useGetTokenPrice = (params: ITokenPriceInput) => {
  return useQuery(['price', params?.token], () => getTokenPrice(params), {
    enabled: !!params?.token,
  });
};
