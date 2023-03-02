import {
  createContext,
  PropsWithChildren,
  useState,
  FC,
  useMemo,
  useContext,
  useEffect,
} from 'react';
import { useAccount } from 'wagmi';
import { useGetShieldedAccount } from 'api/account';
import { ShieldedWallet } from '@privi-stream/common';
import { modalViews, useUI } from './ui';

interface State {
  isLoggedIn: boolean;
  balance: number | string;
  privateKey: string;
  shieldedWallet?: ShieldedWallet;
}

const initialState: State = {
  isLoggedIn: false,
  balance: '0',
  privateKey: '',
};

export const ShieldedAccountContext = createContext<State | any>(initialState);
ShieldedAccountContext.displayName = 'ShieldedAccountContext';

export const ShieldedAccountProvider: FC<PropsWithChildren> = ({ children }) => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const { address, isConnected } = useAccount();
  const { setModalViewAndOpen, setModalConfig } = useUI();
  const { data: shieldedAccount, isLoading } = useGetShieldedAccount({ address });

  useEffect(() => {
    const isNotLoggedIn = !privateKey;

    if (isConnected && isNotLoggedIn) {
      setModalConfig({ closeOnOverlayClick: false });
      setModalViewAndOpen(modalViews.ACCOUNT_LOGIN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, privateKey]);

  const logOut = () => setPrivateKey('');

  const value = useMemo(
    () => ({
      logIn: setPrivateKey,
      logOut,
      privateKey,
      isLoggedIn: !!privateKey,
      shieldedWallet: privateKey ? new ShieldedWallet(privateKey) : undefined,
      isLoading,
      address: shieldedAccount?.address,
      isRegistered: shieldedAccount?.isRegistered,
    }),
    [privateKey, shieldedAccount, setPrivateKey, isLoading],
  );

  return (
    <ShieldedAccountContext.Provider value={value}>{children}</ShieldedAccountContext.Provider>
  );
};

export const useShieldedAccount = () => {
  const context = useContext(ShieldedAccountContext);
  if (context === undefined) {
    throw new Error(`useShieldedAccount must be used within a ShieldedAccountProvider`);
  }
  return context;
};
