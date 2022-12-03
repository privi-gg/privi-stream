import { useContract, useProvider } from 'wagmi';
import tsunami from 'abi/tsunami.json';
import registrar from 'abi/register.json';
import { registrarAddress, tsunamiAddress } from 'config/network';
import { Contract } from 'ethers';

export const useTsunamiContract = () => {
  const provider = useProvider();
  return useContract({
    address: tsunamiAddress,
    abi: tsunami.abi,
    signerOrProvider: provider,
  }) as Contract;
};

export const useRegistrarContract = () => {
  const provider = useProvider();
  return useContract({
    address: registrarAddress,
    abi: registrar.abi,
    signerOrProvider: provider,
  }) as Contract;
};
