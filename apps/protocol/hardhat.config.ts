import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import 'hardhat-deploy';
import '@openzeppelin/hardhat-upgrades';
import dotenv from 'dotenv';

dotenv.config();

const rpcGoerli = process.env.RPC_GOERLI as string;
const rpcMumbai = process.env.RPC_POLYGON_MUMBAI as string;
const rpcChiado = process.env.RPC_GNOSIS_CHIADO as string;

const privateKeys = (process.env.PRIVATE_KEYS_TEST as string).split(',');
const forkEnabled = process.env.HARDHAT_FORK === 'true';

const forkBlock = {
  goerli: 8361140,
  mumbai: 30794887,
  polygon: 28876152,
};

const config: HardhatUserConfig = {
  solidity: { compilers: [{ version: '0.8.19' }, { version: '0.6.11' }] },
  networks: {
    goerli: {
      url: rpcGoerli,
      accounts: privateKeys,
    },
    mumbai: {
      url: rpcMumbai,
      accounts: privateKeys,
    },
    chiado: {
      url: rpcChiado,
      accounts: privateKeys,
    },
    hardhat: {
      forking: {
        url: rpcGoerli,
        blockNumber: forkBlock.goerli,
        enabled: forkEnabled,
      },
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  paths: {
    deploy: './scripts/deploy',
  },
};

export default config;
