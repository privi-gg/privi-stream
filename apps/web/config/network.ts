export const chains = {
  GOERLI: 5,
  POLYGON_MUMBAI: 80001,
};

export const defaultChainId = chains.GOERLI;

export const blockExplorers = {
  [chains.GOERLI]: 'https://goerli.etherscan.io',
  [chains.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
};

export const registrarAddress = '0x20703B9e08b840A2Cb6AB3f7E8B8926C9ed3aF24';
// export const tsunamiAddress = '0xc4c55B2c2Bb6fD0229A7aA508e33bc4Ca54D0aa0'; // wETH withdraws
export const tsunamiAddress = '0x56aDcC1BaF658C19FA4B149270e351db01957ca4'; // ETH withdraws
