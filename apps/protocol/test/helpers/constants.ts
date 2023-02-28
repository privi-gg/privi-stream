import { ethers } from 'hardhat';
const { BigNumber } = ethers;

export const FIELD_SIZE = BigNumber.from(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617',
).toHexString();

export const STREAM_TREE_LEVELS = 21;
export const CHECKPOINT_TREE_LEVELS = 23;
