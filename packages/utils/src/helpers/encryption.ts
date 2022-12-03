import * as nacl from 'tweetnacl';
import * as naclUtil from 'tweetnacl-util';

export interface EncryptedData {
  version: string;
  nonce: string;
  ciphertext: string;
}

export function isNullish(value: any) {
  return value === null || value === undefined;
}

/**
 * Encrypt a message.
 *
 * @param options - The encryption options.
 * @param options.publicKey - The public key of the message recipient.
 * @param options.data - The message data.
 * @param options.version - The type of encryption to use.
 * @returns The encrypted data.
 */
export function encrypt({
  sharedKey,
  data,
  version,
}: {
  sharedKey: string;
  data: unknown;
  version: string;
}): EncryptedData {
  if (isNullish(sharedKey)) {
    throw new Error('Missing publicKey parameter');
  } else if (isNullish(data)) {
    throw new Error('Missing data parameter');
  } else if (isNullish(version)) {
    throw new Error('Missing version parameter');
  }

  switch (version) {
    case 'x25519-xsalsa20-poly1305': {
      if (typeof data !== 'string') {
        throw new Error('Message data must be given as a string');
      }
      // generate ephemeral keypair
      const ephemeralKeyPair = nacl.box.keyPair();

      // assemble encryption parameters - from string to UInt8
      let sharedKeyUInt8Array;
      try {
        sharedKeyUInt8Array = naclUtil.decodeBase64(sharedKey);
      } catch (err) {
        throw new Error('Bad shared key');
      }

      const msgParamsUInt8Array = naclUtil.decodeUTF8(data);
      const nonce = nacl.randomBytes(nacl.box.nonceLength);

      // encrypt
      const encryptedMessage = nacl.box.after(msgParamsUInt8Array, nonce, sharedKeyUInt8Array);

      // handle encrypted data
      const output = {
        version: 'x25519-xsalsa20-poly1305',
        nonce: naclUtil.encodeBase64(nonce),
        ciphertext: naclUtil.encodeBase64(encryptedMessage),
      };
      // return encrypted msg data
      return output;
    }

    default:
      throw new Error('Encryption type/version not supported');
  }
}

/**
 * Decrypt a message.
 *
 * @param options - The decryption options.
 * @param options.encryptedData - The encrypted data.
 * @param options.privateKey - The private key to decrypt with.
 * @returns The decrypted message.
 */
export function decrypt({
  encryptedData,
  sharedKey,
}: {
  encryptedData: EncryptedData;
  sharedKey: string;
}): string {
  if (isNullish(encryptedData)) {
    throw new Error('Missing encryptedData parameter');
  } else if (isNullish(sharedKey)) {
    throw new Error('Missing sharedKey parameter');
  }

  switch (encryptedData.version) {
    case 'x25519-xsalsa20-poly1305': {
      // string to buffer to UInt8Array
      // const recieverPrivateKeyUint8Array = naclDecodeHex(sharedKey);
      // const recieverEncryptionPrivateKey = nacl.box.keyPair.fromSecretKey(
      //   recieverPrivateKeyUint8Array,
      // ).secretKey;

      // assemble decryption parameters
      const nonce = naclUtil.decodeBase64(encryptedData.nonce);
      const ciphertext = naclUtil.decodeBase64(encryptedData.ciphertext);
      //   const ephemPublicKey = naclUtil.decodeBase64(encryptedData.ephemPublicKey);

      let sharedKeyUInt8Array;
      try {
        sharedKeyUInt8Array = naclUtil.decodeBase64(sharedKey);
      } catch (err) {
        throw new Error('Bad shared key');
      }

      // decrypt
      const decryptedMessage = nacl.box.open.after(
        ciphertext,
        nonce,
        sharedKeyUInt8Array,
      ) as Uint8Array;

      // console.log({ encryptedData });

      // console.log({ decryptedMessage });

      // return decrypted msg data
      let output;
      try {
        output = naclUtil.encodeUTF8(decryptedMessage);
      } catch (err) {
        console.error(err);
        throw new Error('Decryption failed.');
      }

      if (output) {
        return output;
      }
      throw new Error('Decryption failed.');
    }

    default:
      throw new Error('Encryption type/version not supported.');
  }
}

export const getPublicKey = (privateKey: string) => {
  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.slice(2);
  }

  const privateKeyUint8Array = naclDecodeHex(privateKey);
  const pubKeyUint8Array = nacl.box.keyPair.fromSecretKey(privateKeyUint8Array).publicKey;
  return '0x' + Buffer.from(pubKeyUint8Array).toString('hex');
};

export const getSharedEncryptionPrivateKey = (privateKey: string, publicKeyOther: string) => {
  if (privateKey.startsWith('0x')) {
    privateKey = privateKey.slice(2);
  }

  if (publicKeyOther.startsWith('0x')) {
    publicKeyOther = publicKeyOther.slice(2);
  }
  const privateKeyUint8Array = naclDecodeHex(privateKey);
  const publicKeyUint8Array = naclDecodeHex(publicKeyOther);
  const encryptionPublicKey = nacl.box.before(publicKeyUint8Array, privateKeyUint8Array);
  return naclUtil.encodeBase64(encryptionPublicKey);
};

function naclDecodeHex(msgHex: string): Uint8Array {
  const msgBase64 = Buffer.from(msgHex, 'hex').toString('base64');
  return naclUtil.decodeBase64(msgBase64);
}
