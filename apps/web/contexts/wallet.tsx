import { FC, PropsWithChildren } from 'react';
import { getDefaultWallets, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { Chain, chain, configureChains, createClient, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc';
import {
  keyAlchemyGoerli,
  keyAlchemyMumbai,
  rpcGnosisChiado,
  rpcShardeumLiberty20,
} from 'config/env';
import { APP_NAME } from 'config/constants';

const chiadoChain: Chain = {
  id: 10200,
  name: 'Gnosis Chiado',
  network: 'chiado',
  rpcUrls: { public: rpcGnosisChiado, default: rpcGnosisChiado },
  testnet: true,
};

const liberty20Chain: Chain = {
  id: 8081,
  name: 'Shardeum Liberty 2.0',
  network: 'liberty20',
  rpcUrls: { public: rpcShardeumLiberty20, default: rpcShardeumLiberty20 },
  testnet: true,
};

const { chains, provider } = configureChains(
  [chain.goerli, chain.polygonMumbai, chiadoChain, liberty20Chain],
  [
    alchemyProvider({ apiKey: keyAlchemyGoerli }),
    alchemyProvider({ apiKey: keyAlchemyMumbai }),
    jsonRpcProvider({
      rpc: () => ({ http: rpcGnosisChiado }),
    }),
    jsonRpcProvider({
      rpc: () => ({ http: rpcShardeumLiberty20 }),
    }),
  ],
);

const { connectors } = getDefaultWallets({
  appName: APP_NAME,
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
});

const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>{children}</RainbowKitProvider>
    </WagmiConfig>
  );
};

export default WalletProvider;
