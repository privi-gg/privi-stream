import { BigNumberish } from 'ethers';
import MerkleTree, { PartialMerkleTree } from 'fixed-merkle-tree';
import { Checkpoint } from '../checkpoint';
import { Stream } from '../stream';

export type CircuitPath = { circuit: string; zKey: string };
export type StreamProverConstructorArgs = {
  snarkJs: any;
  fieldSize: BigNumberish;
  circuitPath: CircuitPath;
  merkleTree?: MerkleTree | PartialMerkleTree;
  showLogs?: boolean;
};

export type CheckpointProverConstructorArgs = {
  snarkJs: any;
  fieldSize: BigNumberish;
  streamTree: MerkleTree | PartialMerkleTree;
  checkpointTree: MerkleTree | PartialMerkleTree;
  circuitPath: CircuitPath;
  showLogs?: boolean;
};

export type CreateData = {
  encryptedDataSender: BigNumberish;
  encryptedDataReceiver: BigNumberish;
};

export type PrepareCreateArgs = {
  output: Stream;
};

export type ExtData = {
  recipient: BigNumberish;
  amount: BigNumberish;
  relayer: BigNumberish;
  fee: BigNumberish;
  encryptedOutput1: BigNumberish;
  encryptedOutput2: BigNumberish;
};

export type CheckpointGenerateProofArgs = {
  input: Checkpoint;
  output: Checkpoint;
  withdrawAmount: BigNumberish;
  currentTime: BigNumberish;
  fee: BigNumberish;
  recipient: BigNumberish;
  relayer: BigNumberish;
};
