import { ethers, type BigNumberish } from 'ethers';
import { Buffer } from 'buffer';
//@ts-ignore
import { poseidon } from 'xcircomlib';

export * from './eth';
export * from './encryption';

const { BigNumber } = ethers;

export const poseidonHash = (...inputs: any[]) =>
  BigNumber.from(poseidon([...inputs])).toHexString();

export const toFixedBuffer = (value: BigNumberish, length: number) =>
  Buffer.from(
    BigNumber.from(value)
      .toHexString()
      .slice(2)
      .padStart(length * 2, '0'),
    'hex',
  );
