import { BN, toFixedHex } from 'privi-utils';
import { generateSnarkProofSolidity } from './helpers';
import { CheckpointGenerateProofArgs, CheckpointProverConstructorArgs } from './types';

export class CheckpointProver {
  snarkJs: CheckpointProverConstructorArgs['snarkJs'];
  fieldSize: CheckpointProverConstructorArgs['fieldSize'];
  circuitPath: CheckpointProverConstructorArgs['circuitPath'];
  streamTree: CheckpointProverConstructorArgs['streamTree'];
  checkpointTree: CheckpointProverConstructorArgs['checkpointTree'];
  showLogs?: CheckpointProverConstructorArgs['showLogs'];

  constructor({
    fieldSize,
    snarkJs,
    circuitPath,
    streamTree,
    checkpointTree,
    showLogs = false,
  }: CheckpointProverConstructorArgs) {
    this.snarkJs = snarkJs;
    this.fieldSize = BN(fieldSize);
    this.streamTree = streamTree;
    this.checkpointTree = checkpointTree;
    this.circuitPath = circuitPath;
    this.showLogs = showLogs;
  }

  async prepareCheckpointProof({
    input,
    output,
    currentTime,
    withdrawAmount,
    fee,
    recipient,
    relayer,
  }: CheckpointGenerateProofArgs) {
    const { proofArgs, withdrawData } = await this.generateProof({
      input,
      output,
      currentTime,
      withdrawAmount,
      fee,
      recipient,
      relayer,
    });

    return { proofArgs, withdrawData };
  }

  async generateProof({
    input,
    output,
    currentTime,
    withdrawAmount,
    fee,
    recipient,
    relayer,
  }: CheckpointGenerateProofArgs) {
    const stream = input.stream;

    if (!stream.senderShieldedWallet) {
      throw new Error('Sender shielded wallet is not set');
    }

    if (!stream.receiverShieldedWallet) {
      throw new Error('Receiver shielded wallet is not set');
    }

    let inCheckpointPathIndices;
    let inCheckpointPathElements;

    if (input.isZero()) {
      input.leafIndex = 0;
      inCheckpointPathIndices = 0;
      inCheckpointPathElements = new Array(this.checkpointTree.levels).fill(0);
    } else {
      input.leafIndex = this.checkpointTree.indexOf(toFixedHex(input.commitment));
      if (input.leafIndex < 0) {
        throw new Error(`Input commitment ${toFixedHex(input.commitment)} was not found`);
      }
      inCheckpointPathIndices = input.leafIndex;
      inCheckpointPathElements = this.checkpointTree.path(input.leafIndex).pathElements;
    }

    if (!stream.leafIndex) {
      stream.leafIndex = this.streamTree.indexOf(toFixedHex(stream.commitment));
    }

    const streamPathIndices = stream.leafIndex;
    const streamPathElements = this.streamTree.path(stream.leafIndex).pathElements;

    const publicAmount = BN(withdrawAmount).add(fee);

    const proofGenInputs = {
      currentTime,
      publicAmount,
      // Stream
      streamRoot: this.streamTree.root,
      streamRate: stream.rate,
      streamStartTime: stream.startTime,
      streamStopTime: stream.stopTime,
      streamBlinding: stream.blinding,
      streamSenderPublicKey: stream.senderShieldedWallet.publicKey,
      streamReceiverPrivateKey: stream.receiverShieldedWallet.privateKey,
      streamPathIndices,
      streamPathElements,
      // Input Checkpoint
      checkpointRoot: this.checkpointTree.root,
      inCheckpointTime: input.checkpointTime,
      inCheckpointBlinding: input.blinding,
      inCheckpointNullifier: input.nullifier,
      inCheckpointPathIndices,
      inCheckpointPathElements,
      // Output Checkpoint
      outCheckpointTime: output.checkpointTime,
      outCheckpointBlinding: output.blinding,
      outCheckpointCommitment: output.commitment,
    };

    this.log(`CheckpointProver`, `Generating proof...`);
    const { proof } = await generateSnarkProofSolidity({
      snarkJs: this.snarkJs,
      circuitPath: this.circuitPath,
      inputs: proofGenInputs,
    });

    const proofArgs = {
      proof,
      currentTime,
      publicAmount: toFixedHex(publicAmount),
      streamRoot: toFixedHex(this.streamTree.root),
      checkpointRoot: toFixedHex(this.checkpointTree.root),
      inCheckpointNullifier: toFixedHex(input.nullifier),
      outCheckpointCommitment: toFixedHex(output.commitment),
    };

    const withdrawData = {
      recipient: toFixedHex(recipient, 20),
      withdrawAmount: toFixedHex(withdrawAmount),
      relayer: toFixedHex(relayer, 20),
      fee: toFixedHex(fee),
      encryptedData: output.encrypt(),
    };

    return {
      proofArgs,
      withdrawData,
    };
  }

  log(...args: any[]) {
    if (this.showLogs) {
      console.log(...args);
    }
  }
}
