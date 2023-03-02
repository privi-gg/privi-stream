import { useQuery } from '@tanstack/react-query';
import { BigNumber, Contract } from 'ethers';
import { fetchUserUnspentNotes } from 'utils/pool';
import { usePoolContract } from 'hooks/contracts';
import { ShieldedWallet } from '@privi-stream/common';

export async function getShieldedBalance(shieldedWallet: ShieldedWallet, pool: Contract) {
  const unspentOutputs = await fetchUserUnspentNotes(shieldedWallet, pool);

  let balance = BigNumber.from(0);
  unspentOutputs.forEach((utxo) => {
    balance = balance.add(utxo.amount);
  });

  return {
    balance,
  };
}

export const useGetShieldedBalance = ({
  shieldedWallet,
  poolAddress,
}: {
  shieldedWallet?: ShieldedWallet;
  poolAddress: string;
}) => {
  const pool = usePoolContract({ poolAddress });

  return useQuery(
    ['shieldedBalance', shieldedWallet?.publicKey, poolAddress],
    () => getShieldedBalance(shieldedWallet as ShieldedWallet, pool),
    {
      enabled: !!shieldedWallet && !!poolAddress,
    },
  );
};
