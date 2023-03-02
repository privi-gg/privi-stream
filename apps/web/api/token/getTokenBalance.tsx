import { erc20ABI, useBalance, useContractReads } from 'wagmi';
import { BigNumber, constants, utils } from 'ethers';

interface TokenBalanceQueryInput {
  address?: `0x${string}`;
  tokenAddress?: `0x${string}`;
}

type BalanceData = ReturnType<typeof useBalance>;

export const useERC20TokenBalance = ({ address, tokenAddress }: TokenBalanceQueryInput) => {
  const contract = { address: tokenAddress, abi: erc20ABI };
  const { data, ...rest } = useContractReads({
    contracts: [
      { ...contract, functionName: 'balanceOf', functionArgs: [address] },
      { ...contract, functionName: 'decimals' },
      { ...contract, functionName: 'symbol' },
    ],
    enabled: !!address && !!tokenAddress,
  });

  let balanceData;

  if (data?.[0]) {
    const value = BigNumber.from(data[0]);
    const decimals = BigNumber.from(data[1]).toNumber();
    balanceData = {
      value,
      formatted: utils.formatUnits(value, decimals),
      decimals,
      symbol: data[2],
    };
  }

  return { data: balanceData, ...rest };
};

export const useGetTokenBalance = ({ address, tokenAddress }: TokenBalanceQueryInput): any => {
  const isNativeToken = tokenAddress === constants.AddressZero;
  const nativeBalanceData = useBalance({
    address: isNativeToken ? address : undefined,
  });
  const erc20BalanceData = useERC20TokenBalance({
    address,
    tokenAddress: isNativeToken ? undefined : tokenAddress,
  });

  if (isNativeToken) {
    return nativeBalanceData;
  }

  return erc20BalanceData;
};
