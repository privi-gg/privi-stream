import { ethers } from 'hardhat';
import { type BigNumberish } from 'ethers';
import { stringifyBigInts, toFixedHex } from './bigInt';
import { FIELD_SIZE } from '../constants';
//@ts-ignore
import * as snark from 'snarkjs';
//@ts-ignore
import { poseidon } from 'xcircomlib';

const { BigNumber } = ethers;

export const poseidonHash = (...inputs: any[]) =>
  BigNumber.from(poseidon([...inputs])).toHexString();

export const modField = (num: BigNumberish) => {
  return BigNumber.from(num).mod(FIELD_SIZE);
};

export const generateSnarkProof = async (inputs: any, circuit: string) => {
  // console.log({ ins: JSON.stringify(stringifyBigInts(inputs)) });

  return snark.groth16.fullProve(
    stringifyBigInts(inputs),
    `./artifacts/circuits/${circuit}_js/${circuit}.wasm`,
    `./artifacts/circuits/${circuit}.zkey`,
  );
};

export const generateSnarkProofSolidity = async (inputs: any, circuit: string) => {
  const { proof, publicSignals } = await generateSnarkProof(inputs, circuit);
  const a = [toFixedHex(proof.pi_a[0]), toFixedHex(proof.pi_a[1])];
  const b = [
    [toFixedHex(proof.pi_b[0][1]), toFixedHex(proof.pi_b[0][0])],
    [toFixedHex(proof.pi_b[1][1]), toFixedHex(proof.pi_b[1][0])],
  ];
  const c = [toFixedHex(proof.pi_c[0]), toFixedHex(proof.pi_c[1])];

  return { proof: { a, b, c }, publicSignals };
};
