import { EthEncryptedData } from '@metamask/eth-sig-util';

export const ENCRYPTION_VERSION = 'x25519-xsalsa20-poly1305';

export function packEncryptedMessage(encryptedMessage: EthEncryptedData) {
  const nonceBuf = Buffer.from(encryptedMessage.nonce, 'base64');
  const ephemPublicKeyBuf = Buffer.from(encryptedMessage.ephemPublicKey, 'base64');
  const ciphertextBuf = Buffer.from(encryptedMessage.ciphertext, 'base64');
  const messageBuff = Buffer.concat([
    Buffer.alloc(24 - nonceBuf.length),
    nonceBuf,
    Buffer.alloc(32 - ephemPublicKeyBuf.length),
    ephemPublicKeyBuf,
    ciphertextBuf,
  ]);
  return '0x' + messageBuff.toString('hex');
}

export function unpackEncryptedMessage(encryptedMessage: string) {
  if (encryptedMessage.slice(0, 2) === '0x') {
    encryptedMessage = encryptedMessage.slice(2);
  }
  const messageBuff = Buffer.from(encryptedMessage, 'hex');
  const nonceBuf = messageBuff.subarray(0, 24);
  const ephemPublicKeyBuf = messageBuff.subarray(24, 56);
  const ciphertextBuf = messageBuff.subarray(56);
  return {
    version: ENCRYPTION_VERSION,
    nonce: nonceBuf.toString('base64'),
    ephemPublicKey: ephemPublicKeyBuf.toString('base64'),
    ciphertext: ciphertextBuf.toString('base64'),
  };
}
