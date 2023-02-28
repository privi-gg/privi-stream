import { BigNumber } from 'ethers';
import { toFixedHex } from 'privi-utils';
import { generateSnarkProofSolidity } from './helpers';
import { CreateData, PrepareCreateArgs, StreamProverConstructorArgs } from './types';

export class StreamProver {
  snarkJs: StreamProverConstructorArgs['snarkJs'];
  fieldSize: StreamProverConstructorArgs['fieldSize'];
  circuitPath: StreamProverConstructorArgs['circuitPath'];
  merkleTree?: StreamProverConstructorArgs['merkleTree'];
  showLogs?: StreamProverConstructorArgs['showLogs'];

  constructor({
    fieldSize,
    snarkJs,
    circuitPath,
    merkleTree,
    showLogs = false,
  }: StreamProverConstructorArgs) {
    this.snarkJs = snarkJs;
    this.fieldSize = BigNumber.from(fieldSize);
    this.merkleTree = merkleTree;
    this.circuitPath = circuitPath;
    this.showLogs = showLogs;
  }

  async prepareCreateProof({ output }: PrepareCreateArgs) {
    const { proofArgs, createData } = await this.generateProof({ output });
    return {
      proofArgs,
      createData,
    };
  }

  async generateProof({ output }: PrepareCreateArgs) {
    const proofInput = {
      publicAmount: output.amount,
      startTime: output.startTime,
      stopTime: output.stopTime,
      rate: output.rate,
      senderPrivateKey: output.senderShieldedWallet.privateKey,
      receiverPublicKey: output.receiverShieldedWallet.publicKey,
      blinding: output.blinding,
      commitment: output.commitment,
    };

    const { proof } = await generateSnarkProofSolidity({
      snarkJs: this.snarkJs,
      inputs: proofInput,
      circuitPath: this.circuitPath,
    });

    const proofArgs = {
      proof,
      publicAmount: toFixedHex(proofInput.publicAmount),
      commitment: toFixedHex(proofInput.commitment),
    };

    const createData: CreateData = {
      encryptedDataSender: output.senderEncrypt(),
      encryptedDataReceiver: output.receiverEncrypt(),
    };

    return {
      proofArgs,
      createData,
    };
  }
}
