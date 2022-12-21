export const env = process.env.NODE_ENV as string;
export const isDev = env === 'development';

export const rpcGoerli = process.env.NEXT_PUBLIC_RPC_GOERLI as string;
export const rpcPolygonMumbai = process.env.NEXT_PUBLIC_RPC_POLYGON_MUMBAI as string;
export const rpcGnosisChiado = process.env.NEXT_PUBLIC_RPC_GNOSIS_CHIADO as string;
export const rpcShardeumLiberty20 = process.env.NEXT_PUBLIC_RPC_SHARDEUM_LIBERTY20 as string;

export const keyAlchemyGoerli = rpcGoerli.split('/').pop() as string;
export const keyAlchemyMumbai = rpcPolygonMumbai.split('/').pop() as string;
