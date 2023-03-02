import 'mocha';
import { expect } from 'chai';
import { Wallet } from 'ethers';
import { ShieldedWallet } from './shieldedWallet';

describe('ShieldedWallet', function () {
  it('should initialize correctly', () => {
    const privateKey = Wallet.createRandom().privateKey;
    expect(() => new ShieldedWallet(privateKey)).to.not.throw();
  });

  it('should encrypt data', () => {
    const senderSw = ShieldedWallet.createRandom();
    const data = Buffer.from('this is some random data');

    expect(() => senderSw.encrypt(data)).to.not.throw();
  });

  it('should decrypt encrypted data', () => {
    const senderSw = ShieldedWallet.createRandom();
    const msg = 'this is some secret message';
    const dataBuf = Buffer.from(msg);

    const encryptedData = senderSw.encrypt(dataBuf);

    const decrypted = senderSw.decrypt(encryptedData);
    expect(decrypted.equals(dataBuf)).to.be.true;
    expect(decrypted.toString()).to.equal(msg);
  });

  it('should construct shielded wallet from address', () => {
    const originalSw = ShieldedWallet.createRandom();
    const address = originalSw.address();

    let sw = ShieldedWallet.fromAddress(address);
    expect(sw.privateKey).to.equal('');
    expect(sw.publicKey.toString()).to.equal(originalSw.publicKey.toString());

    sw = ShieldedWallet.fromPublicKey(originalSw.publicKey);
    expect(sw.privateKey).to.equal('');
    expect(sw.encryptionKey).to.equal('');
    expect(sw.publicKey.toString()).to.equal(originalSw.publicKey.toString());
  });
});
