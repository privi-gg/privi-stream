import { BigNumber, BigNumberish } from 'ethers';
import { BN, poseidonHash, randomBN } from 'privi-utils';
import { toFixedBuffer } from './helpers';
import { ShieldedWallet } from './shieldedWallet';

//@todo constrain stream params to be within field size

export class Stream {
  rate: BigNumber;
  startTime: number;
  stopTime: number;
  blinding: BigNumber;
  senderShieldedWallet?: ShieldedWallet;
  receiverShieldedWallet?: ShieldedWallet;
  leafIndex?: number;

  private _commitment?: string;
  private _nullifier?: string;

  constructor({
    rate,
    startTime,
    stopTime,
    senderShieldedWallet,
    receiverShieldedWallet,
    blinding = randomBN(31),
    leafIndex,
  }: {
    rate: BigNumberish;
    startTime: number;
    stopTime: number;
    senderShieldedWallet?: ShieldedWallet;
    receiverShieldedWallet?: ShieldedWallet;
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
    if (!this.senderShieldedWallet) {
      throw new Error('Cannot compute commitment without sender shielded wallet');
    }

    if (!this.receiverShieldedWallet) {
      throw new Error('Cannot compute commitment without receiver shielded wallet');
    }

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
    if (this._nullifier) {
      return this._nullifier;
    }

    if (!this.senderShieldedWallet?.privateKey) {
      throw new Error('Cannot compute nullifier without sender private key');
    }

    if (!isFinite(this.leafIndex as number)) {
      throw new Error('Cannot compute nullifier without leaf index');
    }

    this._nullifier = poseidonHash(this.commitment, this.blinding, this.leafIndex as number);

    return this._nullifier;
  }

  senderEncrypt() {
    if (!this.senderShieldedWallet) {
      throw new Error('Cannot encrypt stream without sender shielded wallet');
    }
    return this._encrypt(this.senderShieldedWallet);
  }

  receiverEncrypt() {
    if (!this.receiverShieldedWallet) {
      throw new Error('Cannot encrypt stream without receiver shielded wallet');
    }
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
      receiverShieldedWallet?: ShieldedWallet;
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
      senderShieldedWallet?: ShieldedWallet;
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
    if (!this.senderShieldedWallet) {
      throw new Error('Sender shielded wallet is not set');
    }

    if (!this.receiverShieldedWallet) {
      throw new Error('Receiver shielded wallet is not set');
    }

    const bytes = Buffer.concat([
      toFixedBuffer(this.rate, 31), // 248 bits
      toFixedBuffer(this.startTime, 5), // 40 bits
      toFixedBuffer(this.stopTime, 5), // 40 bits
      toFixedBuffer(this.blinding, 31), // 248 bits
      toFixedBuffer(this.senderShieldedWallet.publicKey, 32), // 248 bits
      toFixedBuffer(this.receiverShieldedWallet.publicKey, 32), // 248 bits
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
      senderShieldedWallet?: ShieldedWallet;
      receiverShieldedWallet?: ShieldedWallet;
      leafIndex?: number;
    },
  ) {
    const sw = decryptUsing === 'sender' ? senderShieldedWallet : receiverShieldedWallet;

    if (!sw) {
      throw new Error(`Cannot decrypt stream without ${decryptUsing} shielded wallet`);
    }

    const buf = sw.decrypt(data);
    const rate = BN('0x' + buf.subarray(0, 31).toString('hex'));
    const startTime = BN('0x' + buf.subarray(31, 36).toString('hex')).toNumber();
    const stopTime = BN('0x' + buf.subarray(36, 41).toString('hex')).toNumber();
    const blinding = BN('0x' + buf.subarray(41, 72).toString('hex'));
    const senderPublicKey = '0x' + buf.subarray(72, 104).toString('hex');
    const receiverPublicKey = '0x' + buf.subarray(104, 136).toString('hex');

    if (!senderShieldedWallet) {
      senderShieldedWallet = ShieldedWallet.fromPublicKey(senderPublicKey);
    }

    if (!receiverShieldedWallet) {
      receiverShieldedWallet = ShieldedWallet.fromPublicKey(receiverPublicKey);
    }

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
