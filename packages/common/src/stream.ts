import { BigNumber, BigNumberish } from 'ethers';
import { BN, poseidonHash, randomBN } from 'privi-utils';
import { toFixedBuffer } from './helpers';
import { ShieldedWallet } from './shieldedWallet';

export class Stream {
  rate: BigNumber;
  startTime: number;
  stopTime: number;
  blinding: BigNumber;
  senderShieldedWallet: ShieldedWallet;
  receiverShieldedWallet: ShieldedWallet;
  leafIndex?: number;

  private _commitment?: string;
  private _nullifier?: string;

  constructor({
    rate,
    startTime,
    stopTime,
    senderShieldedWallet,
    receiverShieldedWallet,
    blinding = randomBN(),
    leafIndex,
  }: {
    rate: BigNumberish;
    startTime: number;
    stopTime: number;
    senderShieldedWallet: ShieldedWallet;
    receiverShieldedWallet: ShieldedWallet;
    blinding?: BigNumberish;
    leafIndex?: number;
  }) {
    if (stopTime <= startTime) {
      throw new Error('Stop time must be greater than start time');
    }

    this.rate = BigNumber.from(rate);
    this.startTime = startTime;
    this.stopTime = stopTime;
    this.blinding = BigNumber.from(blinding);
    this.senderShieldedWallet = senderShieldedWallet;
    this.receiverShieldedWallet = receiverShieldedWallet;
    this.leafIndex = leafIndex;
  }

  get duration() {
    return this.stopTime - this.startTime;
  }

  get amount() {
    return this.rate.mul(this.duration);
  }

  /**
   * Returns commitment for this Stream
   */
  get commitment() {
    if (!this._commitment) {
      this._commitment = poseidonHash(
        this.rate,
        this.startTime,
        this.stopTime,
        this.senderShieldedWallet.publicKey,
        this.receiverShieldedWallet.publicKey,
        this.blinding,
      );
    }
    return this._commitment;
  }

  /**
   * Returns nullifier for this Stream
   */
  get nullifier() {
    if (!this._nullifier) {
      if (!isFinite(this.leafIndex as number)) {
        throw new Error('Cannot compute nullifier without leaf index or private key');
      }

      this._nullifier = poseidonHash(this.commitment, this.leafIndex as number);
    }
    return this._nullifier;
  }

  senderEncrypt() {
    return this._encrypt(this.senderShieldedWallet);
  }

  receiverEncrypt() {
    return this._encrypt(this.receiverShieldedWallet);
  }

  static senderDecrypt(
    data: string,
    {
      senderShieldedWallet,
      receiverShieldedWallet,
      leafIndex,
    }: {
      senderShieldedWallet: ShieldedWallet;
      receiverShieldedWallet: ShieldedWallet;
      leafIndex: number;
    },
  ) {
    return Stream._decrypt(data, {
      decryptUsing: 'sender',
      senderShieldedWallet,
      receiverShieldedWallet,
      leafIndex,
    });
  }

  static receiverDecrypt(
    data: string,
    {
      senderShieldedWallet,
      receiverShieldedWallet,
      leafIndex,
    }: {
      senderShieldedWallet: ShieldedWallet;
      receiverShieldedWallet: ShieldedWallet;
      leafIndex: number;
    },
  ) {
    return Stream._decrypt(data, {
      decryptUsing: 'receiver',
      senderShieldedWallet,
      receiverShieldedWallet,
      leafIndex,
    });
  }

  /**
   * Encrypt stream data using give wallet
   */
  private _encrypt(sw: ShieldedWallet) {
    const bytes = Buffer.concat([
      toFixedBuffer(this.rate, 31), // 248 bits
      toFixedBuffer(this.startTime, 5), // 40 bits
      toFixedBuffer(this.stopTime, 5), // 40 bits
      toFixedBuffer(this.blinding, 31), // 248 bits
    ]);

    return sw.encrypt(bytes);
  }

  /**
   * Decrypt a Stream
   */
  private static _decrypt(
    data: string,
    {
      decryptUsing,
      senderShieldedWallet,
      receiverShieldedWallet,
      leafIndex,
    }: {
      decryptUsing: 'sender' | 'receiver';
      senderShieldedWallet: ShieldedWallet;
      receiverShieldedWallet: ShieldedWallet;
      leafIndex: number;
    },
  ) {
    const sw = decryptUsing === 'sender' ? senderShieldedWallet : receiverShieldedWallet;
    const buf = sw.decrypt(data);
    const rate = BN('0x' + buf.subarray(0, 31).toString('hex'));
    const startTime = BN('0x' + buf.subarray(31, 36).toString('hex')).toNumber();
    const stopTime = BN('0x' + buf.subarray(36, 41).toString('hex')).toNumber();
    const blinding = BN('0x' + buf.subarray(41, 72).toString('hex'));

    return new Stream({
      rate,
      startTime,
      stopTime,
      senderShieldedWallet,
      receiverShieldedWallet,
      blinding,
      leafIndex,
    });
  }
}
