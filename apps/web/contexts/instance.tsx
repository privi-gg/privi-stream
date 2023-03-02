import { createContext, FC, PropsWithChildren, useContext, useMemo } from 'react';
import {
  blockExplorers,
  chains,
  defaultChainId,
  InstanceConfig,
  instanceConfig,
} from 'config/network';
import { useNetwork } from 'wagmi';

const supportedChains = Object.values(chains);

interface State {}

const initialState: State = {
  ...instanceConfig[defaultChainId],
  instance: instanceConfig[defaultChainId].instances['matic'],
};

export const InstanceContext = createContext<State | any>(initialState);
InstanceContext.displayName = 'InstanceContext';

export const InstanceProvider: FC<PropsWithChildren> = ({ children }) => {
  const { chain } = useNetwork();

  const getInstance = (chainId: number, token: string) => {
    const config = instanceConfig[chainId];
    return config.instances[token];
  };

  const value = useMemo<InstanceConfig>(() => {
    // let chainId = chain?.id as number;
    // if (!supportedChains.includes(chainId)) {
    //   chainId = defaultChainId;
    // }
    const chainId = defaultChainId;

    const config = instanceConfig[chainId];
    const token = Object.keys(config.instances)[0];
    const explorerUrl = blockExplorers[chainId];

    return { ...config, instance: config.instances[token], chainId, getInstance, explorerUrl };
  }, []);

  return <InstanceContext.Provider value={value}>{children}</InstanceContext.Provider>;
};

export const useInstance = () => {
  const context = useContext(InstanceContext);
  if (context === undefined) {
    throw new Error(`useInstance must be used within a InstanceProvider`);
  }
  return context;
};
