import { BigNumber, BigNumberish } from 'ethers';
import { BN, poseidonHash, randomBN } from 'privi-utils';
import { FIELD_SIZE } from './constants';
import { toFixedBuffer } from './helpers';
import { ShieldedWallet } from './shieldedWallet';
import { Stream } from './stream';

export class Checkpoint {
  stream: Stream;
  checkpointTime: number;
  shieldedWallet?: ShieldedWallet;
  blinding: BigNumber;
  leafIndex?: number;

  private _commitment?: string;
  private _nullifier?: string;

  constructor({
    stream,
    checkpointTime,
    shieldedWallet,
    blinding = randomBN(31),
    leafIndex,
  }: {
    stream: Stream;
    checkpointTime: number;
    shieldedWallet?: ShieldedWallet;
    blinding?: BigNumberish;
    leafIndex?: number;
  }) {
    if (
      shieldedWallet?.publicKey &&
      stream.receiverShieldedWallet?.publicKey &&
      !BN(shieldedWallet.publicKey).eq(stream.receiverShieldedWallet.publicKey)
    ) {
      throw new Error('Shielded wallet must be the receiver of the stream');
    }

    if (checkpointTime < stream.startTime || checkpointTime > stream.stopTime) {
      throw new Error('Checkpoint time must be between stream start and stop times');
    }

    this.stream = stream;
    this.checkpointTime = checkpointTime;
    this.shieldedWallet = shieldedWallet;
    this.blinding = BN(blinding);
    this.leafIndex = leafIndex;
  }

  /**
   * Returns commitment for this Checkpoint
   */
  get commitment() {
    if (!this._commitment) {
      this._commitment = poseidonHash(this.stream.commitment, this.checkpointTime, this.blinding);
    }
    return this._commitment;
  }

  /**
   * Returns nullifier for this Checkpoint
   */
  get nullifier() {
    if (this._nullifier) {
      return this._nullifier;
    }

    if (!this.shieldedWallet) {
      throw new Error('Cannot compute nullifier without shielded wallet');
    }

    if (!isFinite(this.leafIndex as number)) {
      throw new Error('Cannot compute nullifier without leaf index');
    }

    this._nullifier = poseidonHash(this.commitment, this.blinding, this.leafIndex as number);

    return this._nullifier;
  }

  isZero() {
    return this.checkpointTime === this.stream.startTime && this.blinding.eq(this.stream.blinding);
  }

  static zero(stream: Stream) {
    return new Checkpoint({
      stream,
      checkpointTime: stream.startTime,
      shieldedWallet: stream.receiverShieldedWallet,
      blinding: stream.blinding,
    });
  }

  encrypt() {
    if (!this.shieldedWallet) {
      throw new Error('Cannot encrypt without shielded wallet');
    }

    if (!this.stream?.senderShieldedWallet?.publicKey) {
      throw new Error('Cannot encrypt a checkpoint with a sender shielded wallet');
    }

    const bytes = Buffer.concat([
      toFixedBuffer(this.stream.commitment, 32), // 256 bits
      toFixedBuffer(this.stream.senderShieldedWallet?.publicKey, 32), // 256 bits
      toFixedBuffer(this.checkpointTime, 5), // 40 bits
      toFixedBuffer(this.blinding, 31), // 248 bits
    ]);

    return this.shieldedWallet.encrypt(bytes);
  }

  /**
   * Decrypt a Checkpoint
   */
  static decrypt(
    data: string,
    {
      stream,
      shieldedWallet,
      leafIndex,
    }: {
      stream: Stream;
      shieldedWallet: ShieldedWallet;
      leafIndex: number;
    },
  ) {
    const buf = shieldedWallet.decrypt(data);
    const streamCommitment = BN('0x' + buf.subarray(0, 32).toString('hex'));
    const senderPublicKey = BN('0x' + buf.subarray(32, 64).toString('hex'));
    const checkpointTime = BN('0x' + buf.subarray(64, 69).toString('hex')).toNumber();
    const blinding = BN('0x' + buf.subarray(69, 100).toString('hex'));

    if (
      stream.senderShieldedWallet?.publicKey &&
      !BN(senderPublicKey).eq(stream.senderShieldedWallet.publicKey)
    ) {
      throw new Error('Sender public keys do not match');
    }

    if (!streamCommitment.lt(FIELD_SIZE)) {
      throw new Error('Stream commitment is not within field size');
    }

    if (!streamCommitment.eq(stream.commitment)) {
      throw new Error('Stream commitment does not match');
    }

    return new Checkpoint({
      stream,
      checkpointTime,
      shieldedWallet,
      blinding,
      leafIndex,
    });
  }
}
