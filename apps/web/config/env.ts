import { Wallet } from 'ethers';

export const env = process.env.NODE_ENV as string;
export const isDev = env === 'development';

export const rpcGoerli = process.env.NEXT_PUBLIC_RPC_GOERLI as string;
export const rpcPolygonMumbai = process.env.NEXT_PUBLIC_RPC_POLYGON_MUMBAI as string;
export const rpcGnosisChiado = process.env.NEXT_PUBLIC_RPC_GNOSIS_CHIADO as string;

export const keyAlchemyGoerli = rpcGoerli.split('/').pop() as string;
export const keyAlchemyMumbai = rpcPolygonMumbai.split('/').pop() as string;

export const relayerBaseUrl = isDev
  ? 'http://localhost:4000/api/v1'
  : (process.env.NEXT_PUBLIC_RELAYER_BASE_URL as string);
export const relayerAddress = '0xE6D21Ad1Ea84177F365aEcdDa15573916B548943';

export const testPrivateKey1 =
  env === 'development' ? (process.env.NEXT_PUBLIC_TEST_PRIVATE_KEY_1 as string) : '';
export const testPrivateKey2 =
  env === 'development' ? (process.env.NEXT_PUBLIC_TEST_PRIVATE_KEY_2 as string) : '';
export const testWallet1 = testPrivateKey1 ? new Wallet(testPrivateKey1) : undefined;
export const testWallet2 = testPrivateKey1 ? new Wallet(testPrivateKey2) : undefined;

export const testShieldedPk1 = process.env.NEXT_PUBLIC_TEST_SHIELDED_PRIVATE_KEY_1 as string;
export const testShieldedPk2 = process.env.NEXT_PUBLIC_TEST_SHIELDED_PRIVATE_KEY_2 as string;
