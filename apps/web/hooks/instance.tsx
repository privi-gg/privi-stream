import { useMemo } from 'react';
import { useNetwork } from 'wagmi';
import { chains, defaultChainId, Instance, instanceConfig } from 'config/network';

export type InstanceInfo = {
  token: string;
  chainId: number;
  rpcUrl: string;
  instance: Instance;
  instanceAddress: string;
  wTokenGatewayAddress: string;
};

const supportedChains = Object.values(chains);
const useInstance = () => {
  const { chain } = useNetwork();

  const value = useMemo<InstanceInfo>(() => {
    let chainId = chain?.id as number;
    if (!supportedChains.includes(chainId)) {
      chainId = defaultChainId;
    }

    const config = instanceConfig[chainId];

    const token = Object.keys(config.instances)[0];
    const instance = config.instances[token];

    return {
      chainId,
      rpcUrl: config.rpcUrl,
      token,
      instanceAddress: instance.instanceAddress,
      instance,
      wTokenGatewayAddress: config.wTokenGateway,
    };
  }, [chain]);

  return value;
};

export default useInstance;
