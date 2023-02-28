import { ethers, type BigNumberish } from 'ethers';
import { Buffer } from 'buffer';

export * from './encryption';

const { BigNumber } = ethers;

export const toFixedBuffer = (value: BigNumberish, nBytes: number) =>
  Buffer.from(
    BigNumber.from(value)
      .toHexString()
      .slice(2)
      .padStart(nBytes * 2, '0'),
    'hex',
  );
