import { FC, ReactNode } from 'react';
import { ShieldedAccountProvider } from './shieldedAccount';
import { UIProvider } from './ui';
import WalletProvider from './wallet';

const AppContext: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <WalletProvider>
      <ShieldedAccountProvider>
        <UIProvider>{children}</UIProvider>
      </ShieldedAccountProvider>
    </WalletProvider>
  );
};

export default AppContext;
