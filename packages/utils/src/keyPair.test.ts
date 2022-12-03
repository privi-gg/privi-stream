import 'mocha';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { KeyPair } from './keyPair';

describe('KeyPair', function () {
  it('should initialize correctly', () => {
    const privateKey = Wallet.createRandom().privateKey;
    expect(() => new KeyPair(privateKey)).to.not.throw();
  });

  it('should create random pairs', () => {
    expect(() => KeyPair.createRandomPairs()).to.not.throw();

    const randomPairs = KeyPair.createRandomPairs();
    expect(randomPairs).to.be.length(2);
  });

  it('should encrypt data', () => {
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();
    const data = Buffer.from('this is some random data');

    expect(() => senderKeyPair.encrypt(data, receiverKeyPair.otherPublicKey)).to.not.throw();
  });

  it('should decrypt encrypted data using sender key', () => {
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();
    const msg = 'this is some secret message';
    const dataBuf = Buffer.from(msg);

    const encryptedData = senderKeyPair.encrypt(dataBuf, receiverKeyPair.otherPublicKey);

    const decrypted = senderKeyPair.decrypt(encryptedData, receiverKeyPair.otherPublicKey);
    expect(decrypted.equals(dataBuf)).to.be.true;
    expect(decrypted.toString()).to.equal(msg);
  });

  it('should decrypt sender-encrypted data using receiver key', () => {
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();
    const msg = 'this is some secret message';
    const dataBuf = Buffer.from(msg);

    const encryptedData = senderKeyPair.encrypt(dataBuf, receiverKeyPair.otherPublicKey);

    const decrypted = receiverKeyPair.decrypt(encryptedData, senderKeyPair.otherPublicKey);
    expect(decrypted.equals(dataBuf)).to.be.true;
    expect(decrypted.toString()).to.equal(msg);
  });

  it('should decrypt receiver-encrypted data using sender key', () => {
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();
    const msg = 'this is some secret message';
    const dataBuf = Buffer.from(msg);

    const encryptedData = receiverKeyPair.encrypt(dataBuf, senderKeyPair.otherPublicKey);

    const decrypted = senderKeyPair.decrypt(encryptedData, receiverKeyPair.otherPublicKey);
    expect(decrypted.equals(dataBuf)).to.be.true;
    expect(decrypted.toString()).to.equal(msg);
  });

  it('should construct key pair from address', () => {
    const [originalKeyPair] = KeyPair.createRandomPairs();
    const address = originalKeyPair.address();

    const keyPair = KeyPair.fromAddress(address);
    expect(keyPair.privateKey).to.equal('');
    expect(keyPair.publicKey.toString()).to.equal(originalKeyPair.publicKey.toString());
    expect(keyPair.otherPublicKey).to.equal(originalKeyPair.otherPublicKey);
  });
});
