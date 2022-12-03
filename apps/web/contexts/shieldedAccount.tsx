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
// import { useGetShieldedAccount } from 'api/account';
import { KeyPair } from '@tsunami/utils';

interface State {
  isLoggedIn: boolean;
  privateKey: string;
  keyPair?: KeyPair;
}

const initialState: State = {
  isLoggedIn: false,
  privateKey: '',
};

export const ShieldedAccountContext = createContext<State | any>(initialState);
ShieldedAccountContext.displayName = 'ShieldedAccountContext';

export const ShieldedAccountProvider: FC<PropsWithChildren> = ({ children }) => {
  const [privateKey, setPrivateKey] = useState<string>('');
  const { address } = useAccount();
  //   const { data: shieldedAccount, isFetching: isAccountFetching } = useGetShieldedAccount();

  useEffect(() => {
    // Log out
    setPrivateKey('');
  }, [address]);

  const logOut = () => setPrivateKey('');

  const value = useMemo(
    () => ({
      logIn: (pk: string) => setPrivateKey(pk),
      logOut,
      privateKey,
      isLoggedIn: !!privateKey,
      keyPair: privateKey ? new KeyPair(privateKey) : undefined,
      //   isLoading: isAccountFetching && !shieldedAccount,
      //   address: shieldedAccount?.address,
      //   isRegistered: shieldedAccount?.isRegistered,
    }),
    [privateKey, setPrivateKey],
    // [privateKey, , isAccountFetching, , shieldedAccount, setPrivateKey],
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
