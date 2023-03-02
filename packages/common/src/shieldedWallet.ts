import { type BigNumberish } from 'ethers';
import { ethers } from 'ethers';
import { encrypt, decrypt, getEncryptionPublicKey } from '@metamask/eth-sig-util';
import { BN, poseidonHash, toFixedHex } from 'privi-utils';
import { ENCRYPTION_VERSION, packEncryptedMessage, unpackEncryptedMessage } from './helpers';

const { BigNumber, Wallet } = ethers;

export class ShieldedWallet {
  privateKey: string;
  publicKey: string;
  encryptionKey: string;

  /**
   * Initialize a new key pair. Generates a random private key if not defined
   */
  constructor(privatekey = Wallet.createRandom().privateKey) {
    this.privateKey = privatekey;
    this.publicKey = BN(poseidonHash(this.privateKey)).toHexString();
    this.encryptionKey = getEncryptionPublicKey(privatekey.slice(2));
  }

  /**
   * Initialize new key-pair from address string
   */
  static fromAddress(address: string): ShieldedWallet {
    if (address.length === 130) {
      address = address.slice(2);
    }
    if (address.length !== 128) {
      throw new Error('Invalid key length');
    }
    return Object.assign(new ShieldedWallet(), {
      privateKey: '',
      publicKey: BigNumber.from('0x' + address.slice(0, 64)).toHexString(),
      encryptionKey: Buffer.from(address.slice(64, 128), 'hex').toString('base64'),
    });
  }

  static fromPublicKey(publicKey: BigNumberish) {
    return Object.assign(new ShieldedWallet(), {
      privateKey: '',
      publicKey: BigNumber.from(publicKey).toHexString(),
      encryptionKey: '',
    });
  }

  /**
   * KeyPair with random private key
   */
  static createRandom(): ShieldedWallet {
    return new ShieldedWallet(Wallet.createRandom().privateKey);
  }

  toString() {
    return toFixedHex(this.publicKey) + Buffer.from(this.encryptionKey, 'base64').toString('hex');
  }

  equals(sw: ShieldedWallet) {
    return BigNumber.from(this.publicKey).eq(sw.publicKey);
  }

  /**
   * Key address for this key-pair
   */
  address() {
    return this.toString();
  }

  /**
   * Sign a message using key pair private key
   */
  sign(commitment: BigNumberish, merklePath: BigNumberish) {
    return poseidonHash(this.privateKey, commitment, merklePath);
  }

  /**
   * Encrypt data using key-pair encryption key
   */
  encrypt(bytes: Buffer) {
    return packEncryptedMessage(
      encrypt({
        publicKey: this.encryptionKey,
        data: bytes.toString('base64'),
        version: ENCRYPTION_VERSION,
      }),
    );
  }

  /**
   * Decrypt data using key-pair private key
   */
  decrypt(data: string) {
    const decrypted = decrypt({
      encryptedData: unpackEncryptedMessage(data),
      privateKey: this.privateKey.slice(2),
    });
    return Buffer.from(decrypted, 'base64');
  }
}
