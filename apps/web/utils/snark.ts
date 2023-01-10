import { ethers } from 'ethers';
import { type BigNumberish } from 'ethers';
//@ts-ignore
import { poseidon } from 'xcircomlib';

const { BigNumber } = ethers;
import { stringifyBigInts, toFixedHex } from 'utils/eth';

export const ZERO_VALUE = BigNumber.from(
  '21663839004416932945382355908790599225266501822907911457504978515578255421292',
).toHexString();

export const FIELD_SIZE = BigNumber.from(
  '21888242871839275222246405745257275088548364400416034343698204186575808495617',
).toHexString();

export const modField = (num: BigNumberish) => {
  return BigNumber.from(num).mod(FIELD_SIZE);
};

export const poseidonHash = (...inputs: any[]) =>
  BigNumber.from(poseidon([...inputs])).toHexString();

export const generateSnarkProof = async (inputs: any, circuit: string) => {
  const inp = stringifyBigInts(inputs);
  // const jinp = JSON.stringify(inp);
  // console.log({ inp});
  // console.log({ jinp});

  //@ts-ignore
  return snarkjs.groth16.fullProve(
    stringifyBigInts(inputs),
    `/circuits/${circuit}.wasm`,
    `/circuits/${circuit}.zkey`,
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
