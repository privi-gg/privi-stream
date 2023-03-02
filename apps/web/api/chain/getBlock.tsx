import { useQuery } from '@tanstack/react-query';
import { useInstance } from 'contexts/instance';
import { useProvider } from 'wagmi';

export const useGetBlock = (blockTag: string | number) => {
  const provider = useProvider();
  const { chainId } = useInstance();
  return useQuery(['block', blockTag, chainId], () => provider.getBlock(blockTag), {
    enabled: !!blockTag,
  });
};
