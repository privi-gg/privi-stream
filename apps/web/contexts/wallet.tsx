import { FC, PropsWithChildren } from 'react';
import { Chain, getDefaultWallets, lightTheme, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { chain, configureChains, createClient, WagmiConfig } from 'wagmi';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { jsonRpcProvider } from '@wagmi/core/providers/jsonRpc';
import {
  keyAlchemyGoerli,
  keyAlchemyMumbai,
  rpcGnosisChiado,
  rpcShardeumLiberty20,
} from 'config/env';
import { APP_NAME } from 'config/constants';
import fonts from 'theme/fonts';

const chiadoChain: Chain = {
  id: 10200,
  name: 'Gnosis Chiado',
  iconUrl: '/images/gnosis.png',
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

const rainbowKittheme = {
  ...lightTheme({ fontStack: 'system', borderRadius: 'small' }),
  fonts: { body: fonts.body },
};

const WalletProvider: FC<PropsWithChildren> = ({ children }) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains} theme={rainbowKittheme}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default WalletProvider;
