import { type BigNumberish, ethers } from 'ethers';
const { BigNumber, utils } = ethers;

export const bnUtils = utils;

export const toFixedHex = (n: BigNumberish, len: number = 32) => {
  const hex = BigNumber.from(n).toHexString();

  // Handle negative numbers
  if (hex[0] === '-') {
    return '-' + utils.hexZeroPad(hex.slice(1), len);
  }

  return utils.hexZeroPad(hex, len);
};

export const stringifyBigInts = (v: BigNumberish | any): any => {
  if (BigNumber.isBigNumber(v)) {
    return v.toString();
  } else if (Array.isArray(v)) {
    return v.map(stringifyBigInts);
  } else if (typeof v === 'object') {
    const res: any = {};
    for (let key in v) {
      res[key] = stringifyBigInts(v[key]);
    }
    return res;
  }
  return BigNumber.from(v).toString();
};

export const hexifyBigInts = (v: BigNumberish | any): any => {
  if (BigNumber.isBigNumber(v)) {
    return v.toHexString();
  } else if (Array.isArray(v)) {
    return v.map(hexifyBigInts);
  } else if (typeof v === 'object') {
    const res: any = {};
    for (let key in v) {
      res[key] = hexifyBigInts(v[key]);
    }
    return res;
  }
  return BigNumber.from(v).toHexString();
};

export const randomBN = (nBytes: number = 31) => BigNumber.from(utils.randomBytes(nBytes));

export const randomHex = (nBytes: number) => {
  return utils.hexlify(utils.randomBytes(nBytes));
};
