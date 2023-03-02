import { ethers, utils } from 'ethers';
const { BigNumber } = ethers;
const { keccak256, toUtf8Bytes } = utils;

export const FIELD_SIZE = BigNumber.from(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617',
).toHexString();

export const ZERO_LEAF_STREAM = BigNumber.from(keccak256(toUtf8Bytes('privi-stream:stream')))
  .mod(FIELD_SIZE)
  .toHexString();

export const ZERO_LEAF_CHECKPOINT = BigNumber.from(
  keccak256(toUtf8Bytes('privi-stream:checkpoint')),
)
  .mod(FIELD_SIZE)
  .toHexString();
