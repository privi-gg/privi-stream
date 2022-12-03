import { ethers } from 'hardhat';
const { utils, providers, Wallet } = ethers;

const rpcUrl = process.env.RPC_GOERLI as string;
const privateKeys = (process.env.PRIVATE_KEYS_TEST as string).split(',');
const provider = new providers.JsonRpcProvider(rpcUrl);
const wallet = new Wallet(privateKeys[0], provider);
const maxDepositAmt = utils.parseEther('10');

const treeHeight = 20;
const wETHAddress = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6';
const hasherAddress = '0x37D729f076aeC9300b3F89691E9D62F8A0821D8E';
const proposalVerifierAddress = '0x2F02EFB05c42711583f0A8fD9494704F36850392';
const withdrawVerifierAddress = '0x3D01Bf5c1cDF899968190524b93E237F4630298B';
const revokeVerifierAddress = '0x702adE53494cD60649Cf1334718dE956b644bc1a';
const registrarAddress = '0x20703B9e08b840A2Cb6AB3f7E8B8926C9ed3aF24';
// const tsunamiAddress = '0xc4c55B2c2Bb6fD0229A7aA508e33bc4Ca54D0aa0'; // wETH withdraws
const tsunamiAddress = '0x56aDcC1BaF658C19FA4B149270e351db01957ca4'; // ETH withdraws

export async function deployContract(contractName: string, ...args: any[]) {
  const Factory = await ethers.getContractFactory(contractName);
  const instance = await Factory.connect(wallet).deploy(...args);
  return instance.deployed();
}

async function main() {
  // const proposalVerifier = await deployContract(
  //   'contracts/verifiers/ProposalVerifier.sol:Verifier',
  // );
  // console.log('ProposalVerifier:', proposalVerifier.address);
  // const withdrawVerifier = await deployContract(
  //   'contracts/verifiers/WithdrawVerifier.sol:Verifier',
  // );
  // console.log('WithdrawVerifier:', withdrawVerifier.address);
  // const revokeVerifier = await deployContract('contracts/verifiers/RevokeVerifier.sol:Verifier');
  // console.log('RevokeVerifier:', revokeVerifier.address);
  // const registrar = await deployContract('Registrar');
  // console.log('Registrar:', registrar.address);
  const tsunami = await deployContract(
    'Tsunami',
    treeHeight,
    maxDepositAmt,
    hasherAddress,
    wETHAddress,
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
