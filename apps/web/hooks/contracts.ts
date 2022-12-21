import { useContract, useProvider } from 'wagmi';
import tsunami from 'abi/tsunami.json';
import registrar from 'abi/register.json';
import { registrarAddress } from 'config/network';
import { Contract } from 'ethers';
import useInstance from './instance';

export const useTsunamiContract = () => {
  const provider = useProvider();
  const { instance } = useInstance();
  return useContract({
    address: instance.instanceAddress,
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
