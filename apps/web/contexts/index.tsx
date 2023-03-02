import { FC, ReactNode } from 'react';
import { InstanceProvider } from './instance';
import { ShieldedAccountProvider } from './shieldedAccount';
import { UIProvider } from './ui';
import WalletProvider from './wallet';

const AppContext: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <WalletProvider>
      <UIProvider>
        <ShieldedAccountProvider>
          <InstanceProvider>{children}</InstanceProvider>
        </ShieldedAccountProvider>
      </UIProvider>
    </WalletProvider>
  );
};

export default AppContext;
