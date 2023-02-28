import { ethers } from 'hardhat';
import { Wallet } from 'ethers';
import { poseidonArtifact } from 'privi-utils';

export async function deployHasher(wallet?: Wallet) {
  const abi = poseidonArtifact.abi;
  const bytecode = poseidonArtifact.bytecode;
  const Factory = await ethers.getContractFactory(abi, bytecode);
  let instance;
  if (wallet) {
    instance = await Factory.connect(wallet).deploy();
  } else {
    instance = await Factory.deploy();
  }
  return instance.deployed();
}
