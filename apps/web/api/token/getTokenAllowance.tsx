import { erc20ABI, useContractReads } from 'wagmi';
import { BigNumber, utils } from 'ethers';

interface TokenAllowanceQueryInput {
  owner?: `0x${string}`;
  spender?: `0x${string}`;
  token?: `0x${string}`;
}

export const useGetTokenAllowance = ({ owner, spender, token }: TokenAllowanceQueryInput) => {
  const contract = { address: token, abi: erc20ABI };

  const { data, ...rest } = useContractReads({
    contracts: [
      { ...contract, functionName: 'allowance', args: [owner as any, spender as any] },
      { ...contract, functionName: 'decimals' },
      { ...contract, functionName: 'symbol' },
    ],
    enabled: !!owner && !!spender && !!token,
  });

  let allowanceData;
  if (data?.[0]) {
    const value = BigNumber.from(data[0]);
    const decimals = BigNumber.from(data[1]).toNumber();
    allowanceData = {
      value,
      formatted: utils.formatUnits(value, decimals),
      decimals,
      symbol: data[2],
    };
  }

  return { data: allowanceData, ...rest };
};
