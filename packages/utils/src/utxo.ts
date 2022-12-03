import { BigNumber, BigNumberish } from 'ethers';
import { KeyPair } from './keyPair';
import { poseidonHash, randomBN, toFixedBuffer } from './helpers';

export class Utxo {
  amount: BigNumber;
  startTime: number;
  stopTime: number;
  checkpointTime: number;
  rate: BigNumber;
  blinding: BigNumber;
  senderKeyPair: KeyPair;
  receiverKeyPair: KeyPair;
  index?: number;
  private _commitment?: string;
  private _nullifier?: string;

  constructor({
    amount,
    startTime,
    stopTime,
    checkpointTime,
    rate,
    senderKeyPair,
    receiverKeyPair,
    blinding = randomBN(),
    index,
  }: {
    amount: BigNumberish;
    startTime: number;
    stopTime: number;
    checkpointTime: number;
    rate: BigNumberish;
    senderKeyPair: KeyPair;
    receiverKeyPair: KeyPair;
    blinding?: BigNumberish;
    index?: number;
  }) {
    this.amount = BigNumber.from(amount);
    this.startTime = startTime;
    this.stopTime = stopTime;
    this.checkpointTime = checkpointTime ? checkpointTime : startTime;
    this.rate = BigNumber.from(rate);
    this.blinding = BigNumber.from(blinding);
    this.senderKeyPair = senderKeyPair;
    this.receiverKeyPair = receiverKeyPair;
    this.index = index;
  }

  /**
   * Returns commitment for this UTXO
   */
  get commitment() {
    if (!this._commitment) {
      this._commitment = poseidonHash(
        this.amount,
        this.startTime,
        this.stopTime,
        this.checkpointTime,
        this.rate,
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
      if (this.amount.gt(0) && !isFinite(this.index as number)) {
        throw new Error('Can not compute nullifier without utxo index or private key');
      }

      this._nullifier = poseidonHash(this.commitment, this.index as number);
    }
    return this._nullifier;
  }

  /**
   * Encrypt UTXO data using the current keyPair
   */
  encrypt(opts: { useKeyPair?: 'sender' | 'receiver' } = { useKeyPair: 'sender' }) {
    const bytes = Buffer.concat([
      toFixedBuffer(this.amount, 31),
      toFixedBuffer(this.startTime, 31),
      toFixedBuffer(this.stopTime, 31),
      toFixedBuffer(this.checkpointTime, 31),
      toFixedBuffer(this.rate, 31),
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
      index,
    }: {
      senderKeyPair: KeyPair;
      receiverKeyPair: KeyPair;
      useKeyPair?: 'sender' | 'receiver';
      index: number;
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
      amount: BigNumber.from('0x' + buf.subarray(0, 31).toString('hex')),
      startTime: BigNumber.from('0x' + buf.subarray(31, 62).toString('hex')).toNumber(),
      stopTime: BigNumber.from('0x' + buf.subarray(62, 93).toString('hex')).toNumber(),
      checkpointTime: BigNumber.from('0x' + buf.subarray(93, 124).toString('hex')).toNumber(),
      rate: BigNumber.from('0x' + buf.subarray(124, 155).toString('hex')),
      blinding: BigNumber.from('0x' + buf.subarray(155, 186).toString('hex')),
      senderKeyPair,
      receiverKeyPair,
      index,
    });
  }
}
