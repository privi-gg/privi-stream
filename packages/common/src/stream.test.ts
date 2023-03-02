import 'mocha';
import { expect } from 'chai';
import { utils } from 'ethers';
import { Stream } from './stream';
import { ShieldedWallet } from './shieldedWallet';
import { BN } from 'privi-utils';

describe('Stream', function () {
  const createStream = (
    senderShieldedWallet: ShieldedWallet,
    receiverShieldedWallet: ShieldedWallet,
  ) => {
    const duration = 30 * 24 * 60 * 60;
    const rate = utils.parseEther('0.00001');
    const startTime = Math.round(Date.now() / 1000);
    const stopTime = startTime + duration;

    return new Stream({
      rate,
      startTime,
      stopTime,
      senderShieldedWallet,
      receiverShieldedWallet,
    });
  };

  it('should initialize correctly', () => {
    const senderShieldedWallet = ShieldedWallet.createRandom();
    const receiverShieldedWallet = ShieldedWallet.createRandom();

    const duration = 30 * 24 * 60 * 60;
    const rate = utils.parseEther('0.00001');
    const startTime = Math.round(Date.now());
    const stopTime = startTime + duration;

    expect(
      () =>
        new Stream({
          rate,
          startTime,
          stopTime,
          senderShieldedWallet,
          receiverShieldedWallet,
        }),
    ).to.not.throw();

    const stream = createStream(senderShieldedWallet, receiverShieldedWallet);

    expect(stream.duration).to.equal(stream.stopTime - stream.startTime);
    expect(stream.amount.toString()).to.equal(
      rate.mul(stream.stopTime - stream.startTime).toString(),
    );
  });

  it('should encrypt', () => {
    const senderShieldedWallet = ShieldedWallet.createRandom();
    const receiverShieldedWallet = ShieldedWallet.createRandom();
    const stream = createStream(senderShieldedWallet, receiverShieldedWallet);

    expect(() => stream.senderEncrypt()).to.not.throw();
    expect(() => stream.receiverEncrypt()).to.not.throw();
  });

  it('should decrypt correctly', () => {
    const senderShieldedWallet = ShieldedWallet.createRandom();
    const receiverShieldedWallet = ShieldedWallet.createRandom();
    const originalStream = createStream(senderShieldedWallet, receiverShieldedWallet);

    const encryptedBySender = originalStream.senderEncrypt();
    const encryptedByReceiver = originalStream.receiverEncrypt();

    const senderDecrypted = Stream.senderDecrypt(encryptedBySender, {
      senderShieldedWallet,
      leafIndex: 1,
    });
    const receiverDecrypted = Stream.receiverDecrypt(encryptedByReceiver, {
      receiverShieldedWallet,
      leafIndex: 1,
    });

    expect(senderDecrypted.rate.eq(originalStream.rate)).to.be.true;
    expect(senderDecrypted.startTime).to.equal(originalStream.startTime);
    expect(senderDecrypted.stopTime).to.equal(originalStream.stopTime);

    expect(senderDecrypted.blinding.eq(originalStream.blinding)).to.be.true;
    expect(
      BN(senderDecrypted.receiverShieldedWallet?.publicKey).eq(
        originalStream.receiverShieldedWallet?.publicKey as string,
      ),
    ).to.be.true;

    expect(receiverDecrypted.rate.eq(originalStream.rate)).to.be.true;
    expect(receiverDecrypted.startTime).to.equal(originalStream.startTime);
    expect(receiverDecrypted.stopTime).to.equal(originalStream.stopTime);
    expect(receiverDecrypted.blinding.eq(originalStream.blinding)).to.be.true;
    expect(
      BN(receiverDecrypted.senderShieldedWallet?.publicKey).eq(
        originalStream.senderShieldedWallet?.publicKey as string,
      ),
    ).to.be.true;
  });
});
