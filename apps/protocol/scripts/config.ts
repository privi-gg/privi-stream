import { BigNumber } from 'ethers';
import { parseEther } from 'privi-utils';

type TokenInstance = {
  address: string;
  maxDepositAmount: BigNumber;
  numStreamTreeLevels: number;
  numCheckpointTreeLevels: number;
};

type NetworkInstances = {
  chainId: string;
  wrappedNativeToken: string;
  sanctionsList: string;
  tokens: Record<string, TokenInstance>;
};

const goerli: NetworkInstances = {
  chainId: '5',
  wrappedNativeToken: 'weth',
  sanctionsList: '0xAAB8Bd495Ae247DF6798A60b7f9c52e15dCb071b',
  tokens: {
    weth: {
      address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
      maxDepositAmount: parseEther('1'),
      numStreamTreeLevels: 21,
      numCheckpointTreeLevels: 23,
    },
  },
};

const polygonMumbai: NetworkInstances = {
  chainId: '80001',
  wrappedNativeToken: 'wmatic',
  sanctionsList: '0x80Ca34172fFA772Bc22E7C92E8e0aa5098E02216',
  tokens: {
    wmatic: {
      address: '0xf237dE5664D3c2D2545684E76fef02A3A58A364c',
      maxDepositAmount: parseEther('500'),
      numStreamTreeLevels: 21,
      numCheckpointTreeLevels: 23,
    },
  },
};

const gnosisChiado: NetworkInstances = {
  chainId: '10200',
  wrappedNativeToken: 'wxdai',
  sanctionsList: '0xAAB8Bd495Ae247DF6798A60b7f9c52e15dCb071b',
  tokens: {
    wxdai: {
      address: '0x8D08ac9a511581C7e5BDf8CEd27b7353d0EB7e40',
      maxDepositAmount: parseEther('1000'),
      numStreamTreeLevels: 21,
      numCheckpointTreeLevels: 23,
    },
  },
};

// For deploy test run
const hardhat: NetworkInstances = {
  chainId: '31337',
  tokens: goerli.tokens,
  sanctionsList: goerli.sanctionsList,
  wrappedNativeToken: goerli.wrappedNativeToken,
};

export const networks: Record<string, NetworkInstances> = {
  [goerli.chainId]: goerli,
  [polygonMumbai.chainId]: polygonMumbai,
  [gnosisChiado.chainId]: gnosisChiado,
  [hardhat.chainId]: hardhat,
};
