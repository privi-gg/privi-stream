import { type BigNumberish } from 'ethers';
import MerkleTree from 'fixed-merkle-tree';
import { ZERO_LEAF_STREAM, ZERO_LEAF_CHECKPOINT } from '@privi-stream/common';
import { BN, poseidonHash } from 'privi-utils';

export const cloneObject = (v: any) => {
  return JSON.parse(JSON.stringify(v));
};

export const getNewStreamTree = (nLevels: number) => {
  const tree = new MerkleTree(nLevels, [], {
    hashFunction: poseidonHash,
    zeroElement: ZERO_LEAF_STREAM,
  });
  return tree;
};

export const getNewCheckpointTree = (nLevels: number) => {
  const tree = new MerkleTree(nLevels, [], {
    hashFunction: poseidonHash,
    zeroElement: ZERO_LEAF_CHECKPOINT,
  });
  return tree;
};

export const toFixedBuffer = (value: BigNumberish, length: number) =>
  Buffer.from(
    BN(value)
      .toHexString()
      .slice(2)
      .padStart(length * 2, '0'),
    'hex',
  );
