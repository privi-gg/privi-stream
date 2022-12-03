import { type BigNumberish, ethers } from 'ethers';
import {
  decrypt,
  encrypt,
  getPublicKey,
  getSharedEncryptionPrivateKey,
  poseidonHash,
  toFixedHex,
} from './helpers';

const { BigNumber, Wallet } = ethers;

const ENCRYPTION_VERSION = 'x25519-xsalsa20-poly1305';

export function packEncryptedMessage(encryptedMessage: any) {
  const nonceBuf = Buffer.from(encryptedMessage.nonce, 'base64');
  const ciphertextBuf = Buffer.from(encryptedMessage.ciphertext, 'base64');
  const messageBuff = Buffer.concat([nonceBuf, ciphertextBuf]);
  return '0x' + messageBuff.toString('hex');
}

export function unpackEncryptedMessage(encryptedMessage: string) {
  if (encryptedMessage.slice(0, 2) === '0x') {
    encryptedMessage = encryptedMessage.slice(2);
  }
  const messageBuff = Buffer.from(encryptedMessage, 'hex');
  const nonceBuf = messageBuff.subarray(0, 24);
  const ciphertextBuf = messageBuff.subarray(24);
  return {
    version: ENCRYPTION_VERSION,
    nonce: nonceBuf.toString('base64'),
    ciphertext: ciphertextBuf.toString('base64'),
  };
}

export class KeyPair {
  privateKey: string;
  publicKey: BigNumberish;
  otherPublicKey: string;

  /**
   * Initialize a new key pair.
   */
  constructor(privatekey: string) {
    this.privateKey = privatekey;
    this.publicKey = BigNumber.from(poseidonHash(this.privateKey));
    this.otherPublicKey = getPublicKey(privatekey);
  }

  /**
   * Initialize new key-pair from address string
   */
  static fromAddress(address: string): KeyPair {
    if (address.length !== 130) {
      throw new Error('Invalid key length');
    }

    const publicKey = address.slice(0, 66);
    const otherPublicKey = '0x' + address.slice(66);
    const [keyPair] = this.createRandomPairs();
    keyPair.privateKey = '';
    keyPair.publicKey = BigNumber.from(publicKey);
    keyPair.otherPublicKey = otherPublicKey;
    return keyPair;
  }

  getSharedKeyWith(otherPubKeyB: string) {
    const sharedKey = getSharedEncryptionPrivateKey(this.privateKey, otherPubKeyB);
    return sharedKey;
  }

  /**
   * KeyPairs pair with random private key
   */
  static createRandomPairs(): KeyPair[] {
    const walletA = Wallet.createRandom();
    const walletB = Wallet.createRandom();

    return [new KeyPair(walletA.privateKey), new KeyPair(walletB.privateKey)];
  }

  toString() {
    const otherPubKey = getPublicKey(this.privateKey);
    return toFixedHex(this.publicKey) + otherPubKey.slice(2);
  }

  equals(keyPair: KeyPair) {
    return BigNumber.from(this.publicKey).eq(keyPair.publicKey);
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
  encrypt(bytes: Buffer, otherPubKeyOrAddressB: string) {
    let otherPubKeyB: string;
    if (otherPubKeyOrAddressB.length > 66) {
      otherPubKeyB = otherPubKeyOrAddressB.slice(66);
    } else {
      otherPubKeyB = otherPubKeyOrAddressB;
    }

    const sharedKey = this.getSharedKeyWith(otherPubKeyB);
    return packEncryptedMessage(
      encrypt({
        sharedKey,
        data: bytes.toString('base64'),
        version: ENCRYPTION_VERSION,
      }),
    );
  }

  /**
   * Decrypt data using key-pair private key
   */
  decrypt(data: string, otherPubKeyOrAddressB: string) {
    let otherPubKeyB: string;
    if (otherPubKeyOrAddressB.length > 66) {
      otherPubKeyB = otherPubKeyOrAddressB.slice(66);
    } else {
      otherPubKeyB = otherPubKeyOrAddressB;
    }

    const sharedKey = this.getSharedKeyWith(otherPubKeyB);
    const decrypted = decrypt({
      encryptedData: unpackEncryptedMessage(data),
      sharedKey,
    });

    return Buffer.from(decrypted, 'base64');
  }
}
