import { ethers } from 'hardhat';
const genContract = require('xcircomlib/src/poseidon_gencontract.js');

export async function deployHasher(wallet?: any) {
  const abi = genContract.generateABI(2) as any[];
  const bytecode = genContract.createCode(2) as any;
  const Factory = await ethers.getContractFactory(abi, bytecode);
  let instance;
  if (wallet) {
    instance = await Factory.connect(wallet).deploy();
  } else {
    instance = await Factory.deploy();
  }
  return instance.deployed();
}
