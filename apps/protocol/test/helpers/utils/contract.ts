import { ethers } from 'hardhat';

export async function deployContract(contractName: string, ...args: any[]) {
  const Factory = await ethers.getContractFactory(contractName);

  const instance = await Factory.deploy(...args);
  return instance.deployed();
}
