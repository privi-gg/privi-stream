const goerli = {
  chainId: '5',
  wrappedNativeCurrency: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
};

const polygonMumbai = {
  chainId: '80001',
  wrappedNativeCurrency: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
};

const gnosisChiado = {
  chainId: '10200',
  wrappedNativeCurrency: '0xfbe7a8FFD4EcB1678152bafb4915F1e5869178b0',
};

// Supposed to be a Goerli fork
const hardhat = {
  chainId: '31337',
  wrappedNativeCurrency: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6',
};

const networks = {
  [goerli.chainId]: goerli,
  [polygonMumbai.chainId]: polygonMumbai,
  [gnosisChiado.chainId]: gnosisChiado,
  [hardhat.chainId]: hardhat,
};

export default networks;
