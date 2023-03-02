import { useQuery } from '@tanstack/react-query';
import { Contract } from 'ethers';
import { useRegistrarContract } from 'hooks/contracts';
import { ShieldedWallet } from '@privi-stream/common';

export async function getShieldedAccount(address: string, registrar: Contract) {
  const registerEventFilter = registrar.filters.ShieldedAddress(address);
  const events = await registrar.queryFilter(registerEventFilter);
  const shieldedAddress = events?.[events.length - 1]?.args?.shieldedAddress;

  return {
    address: shieldedAddress,
    isRegistered: !!shieldedAddress,
    shieldedWallet: shieldedAddress ? ShieldedWallet.fromAddress(shieldedAddress) : undefined,
  };
}

export const useGetShieldedAccount = (params: { address?: string }) => {
  const registrar = useRegistrarContract();

  const address = params?.address;

  return useQuery(['account', address], () => getShieldedAccount(address as string, registrar), {
    enabled: !!address,
  });
};
