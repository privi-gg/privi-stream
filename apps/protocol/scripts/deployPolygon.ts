import { ethers } from 'hardhat';
import { deployHasher } from './hasher';
const { utils, providers, Wallet } = ethers;

const rpcUrl = process.env.RPC_GOERLI as string;
const privateKeys = (process.env.PRIVATE_KEYS_TEST as string).split(',');
const provider = new providers.JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKeys[0], provider);
const maxDepositAmt = utils.parseEther('10');

const treeHeight = 20;
const wMaticAddress = '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889';
const hasherAddress = '0x06e495CD43c59d1f9E91C39Dd510Cf86ac00F5eD';
const proposalVerifierAddress = '0x3917895064378fdc0dD56352eE1BF8bC65404E95';
const withdrawVerifierAddress = '0xf03eB1a45df3aFC6404B9A231eD1223Fd7FeB908';
const revokeVerifierAddress = '0x5D6a43A3038483E7aD2FBC0A0009acb4Cf91CF70';
const registrarAddress = '0x4ADDB2eBd0526c7E831889123b547d0c13bDF044';
// const tsunamiAddress = '0xc4c55B2c2Bb6fD0229A7aA508e33bc4Ca54D0aa0'; // wETH withdraws
const tsunamiAddress = '0xbfCA28089Fbe5Ea7F6Fce568c6631149DD11935C'; // ETH withdraws

export async function deployContract(contractName: string, ...args: any[]) {
  const Factory = await ethers.getContractFactory(contractName);
  const instance = await Factory.connect(wallet).deploy(...args);
  return instance.deployed();
}

async function main() {
  //   const hasher = await deployHasher(wallet);
  //   console.log('hasher', hasher.address);

  //   const proposalVerifier = await deployContract(
  //     'contracts/verifiers/ProposalVerifier.sol:Verifier',
  //   );
  //   console.log('ProposalVerifier:', proposalVerifier.address);
  //   const withdrawVerifier = await deployContract(
  //     'contracts/verifiers/WithdrawVerifier.sol:Verifier',
  //   );
  //   console.log('WithdrawVerifier:', withdrawVerifier.address);
  //   const revokeVerifier = await deployContract('contracts/verifiers/RevokeVerifier.sol:Verifier');
  //   console.log('RevokeVerifier:', revokeVerifier.address);
  //   const registrar = await deployContract('Registrar');
  //   console.log('Registrar:', registrar.address);
  const tsunami = await deployContract(
    'Tsunami',
    treeHeight,
    maxDepositAmt,
    hasherAddress,
    wMaticAddress,
    proposalVerifierAddress,
    withdrawVerifierAddress,
    revokeVerifierAddress,
  );
  console.log('Tsunami:', tsunami.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
