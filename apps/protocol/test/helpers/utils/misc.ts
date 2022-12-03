import { ethers } from 'hardhat';
import MerkleTree from 'fixed-merkle-tree';
import { TREE_HEIGHT, ZERO_VALUE } from '../constants';
import { poseidonHash } from './snark';
import { type BigNumberish } from 'ethers';

const { BigNumber, utils } = ethers;

export const cloneObject = (v: any) => {
  return JSON.parse(JSON.stringify(v));
};

export const getNewTree = () => {
  const tree = new MerkleTree(TREE_HEIGHT, [], {
    hashFunction: poseidonHash,
    zeroElement: ZERO_VALUE,
  });
  return tree;
};

export const print = (v: any) => {
  console.log(JSON.stringify(v, undefined, 2));
};

export const toFixedBuffer = (value: BigNumberish, length: number) =>
  Buffer.from(
    BigNumber.from(value)
      .toHexString()
      .slice(2)
      .padStart(length * 2, '0'),
    'hex'
  );
