import { BigNumber, BigNumberish } from 'ethers';
import { KeyPair } from './keyPair';
import { poseidonHash, randomBN, toFixedBuffer } from './helpers';

export class Utxo {
  rate: BigNumber;
  startTime: number;
  stopTime: number;
  checkpointTime: number;
  blinding: BigNumber;
  senderKeyPair: KeyPair;
  receiverKeyPair: KeyPair;
  leafIndex?: number;
  private _amount?: BigNumber;
  private _commitment?: string;
  private _nullifier?: string;

  constructor({
    rate,
    startTime,
    stopTime,
    checkpointTime,
    senderKeyPair,
    receiverKeyPair,
    blinding = randomBN(),
    leafIndex,
  }: {
    rate: BigNumberish;
    startTime: number;
    stopTime: number;
    checkpointTime: number;
    senderKeyPair: KeyPair;
    receiverKeyPair: KeyPair;
    blinding?: BigNumberish;
    leafIndex?: number;
  }) {
    if (stopTime <= startTime) {
      throw new Error('Stop time must be greater than start time');
    }

    if (checkpointTime < startTime || checkpointTime > stopTime) {
      throw new Error('Checkpoint time must be between start and stop time');
    }

    this.rate = BigNumber.from(rate);
    this.startTime = startTime;
    this.stopTime = stopTime;
    this.checkpointTime = checkpointTime;
    this.blinding = BigNumber.from(blinding);
    this.senderKeyPair = senderKeyPair;
    this.receiverKeyPair = receiverKeyPair;
    this.leafIndex = leafIndex;
  }

  get amount() {
    if (!this._amount) {
      this._amount = this.rate.mul(this.stopTime - this.startTime);
    }
    return this._amount;
  }

  /**
   * Returns commitment for this UTXO
   */
  get commitment() {
    if (!this._commitment) {
      this._commitment = poseidonHash(
        this.rate,
        this.startTime,
        this.stopTime,
        this.checkpointTime,
        this.senderKeyPair.publicKey,
        this.receiverKeyPair.publicKey,
        this.blinding,
      );
    }
    return this._commitment;
  }

  /**
   * Returns nullifier for this UTXO
   */
  get nullifier() {
    if (!this._nullifier) {
      if (!isFinite(this.leafIndex as number)) {
        throw new Error('Cannot compute nullifier without utxo index or private key');
      }

      this._nullifier = poseidonHash(this.commitment, this.leafIndex as number);
    }
    return this._nullifier;
  }

  withdraw(outputCheckpointTime: number) {
    if (outputCheckpointTime <= this.checkpointTime) {
      throw new Error('Output checkpoint time must be greater than input checkpoint time');
    }

    const output = new Utxo({
      rate: this.rate,
      startTime: this.startTime,
      stopTime: this.stopTime,
      checkpointTime: outputCheckpointTime,
      senderKeyPair: this.senderKeyPair,
      receiverKeyPair: this.receiverKeyPair,
    });

    return output;
  }

  revoke(outputStopTime: number) {
    if (outputStopTime >= this.stopTime) {
      throw new Error('Output stop time must be less than input stop time');
    }

    if (outputStopTime <= this.checkpointTime) {
      throw new Error('Output stop time must be greater than input checkpoint time');
    }

    const output = new Utxo({
      rate: this.rate,
      startTime: this.startTime,
      stopTime: outputStopTime,
      checkpointTime: this.checkpointTime,
      senderKeyPair: this.senderKeyPair,
      receiverKeyPair: this.receiverKeyPair,
    });

    return output;
  }

  /**
   * Encrypt UTXO data using the current keyPair
   */
  encrypt(opts: { useKeyPair?: 'sender' | 'receiver' } = { useKeyPair: 'sender' }) {
    const bytes = Buffer.concat([
      toFixedBuffer(this.rate, 31),
      toFixedBuffer(this.startTime, 31),
      toFixedBuffer(this.stopTime, 31),
      toFixedBuffer(this.checkpointTime, 31),
      toFixedBuffer(this.blinding, 31),
    ]);

    const { useKeyPair } = opts;

    let encryptionKeyPair: KeyPair;
    let otherPubKey: string;
    if (useKeyPair === 'receiver') {
      encryptionKeyPair = this.receiverKeyPair;
      otherPubKey = this.senderKeyPair.otherPublicKey;
    } else if (useKeyPair === 'sender') {
      encryptionKeyPair = this.senderKeyPair;
      otherPubKey = this.receiverKeyPair.otherPublicKey;
    } else {
      throw new Error('Unknown encryption party');
    }

    return encryptionKeyPair.encrypt(bytes, otherPubKey);
  }

  /**
   * Decrypt a UTXO
   */
  static decrypt(
    data: string,
    {
      senderKeyPair,
      receiverKeyPair,
      useKeyPair = 'receiver',
      leafIndex,
    }: {
      senderKeyPair: KeyPair;
      receiverKeyPair: KeyPair;
      useKeyPair?: 'sender' | 'receiver';
      leafIndex: number;
    },
  ) {
    let decryptionKeyPair: KeyPair;
    let otherPubKey: string;
    if (useKeyPair === 'receiver') {
      decryptionKeyPair = receiverKeyPair;
      otherPubKey = senderKeyPair.otherPublicKey;
    } else if (useKeyPair === 'sender') {
      decryptionKeyPair = senderKeyPair;
      otherPubKey = receiverKeyPair.otherPublicKey;
    } else {
      throw new Error('Unknown encryption party');
    }

    const buf = decryptionKeyPair.decrypt(data, otherPubKey);

    return new Utxo({
      rate: BigNumber.from('0x' + buf.subarray(0, 31).toString('hex')),
      startTime: BigNumber.from('0x' + buf.subarray(31, 62).toString('hex')).toNumber(),
      stopTime: BigNumber.from('0x' + buf.subarray(62, 93).toString('hex')).toNumber(),
      checkpointTime: BigNumber.from('0x' + buf.subarray(93, 124).toString('hex')).toNumber(),
      blinding: BigNumber.from('0x' + buf.subarray(124, 155).toString('hex')),
      senderKeyPair,
      receiverKeyPair,
      leafIndex: leafIndex,
    });
  }
}
