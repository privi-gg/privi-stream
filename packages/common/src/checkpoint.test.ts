import 'mocha';
import { expect } from 'chai';
import { utils } from 'ethers';
import { Stream } from './stream';
import { Checkpoint } from './checkpoint';
import { ShieldedWallet } from './shieldedWallet';

describe('Checkpoint', function () {
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

  const createCheckpoint = (
    senderShieldedWallet: ShieldedWallet,
    receiverShieldedWallet: ShieldedWallet,
  ) => {
    const stream = createStream(senderShieldedWallet, receiverShieldedWallet);
    const checkpointTime = Math.round((stream.startTime + stream.stopTime) / 2);

    return new Checkpoint({
      stream,
      checkpointTime,
      shieldedWallet: receiverShieldedWallet,
    });
  };

  it('should initialize correctly', () => {
    const senderShieldedWallet = ShieldedWallet.createRandom();
    const receiverShieldedWallet = ShieldedWallet.createRandom();
    const unknownShieldedWallet = ShieldedWallet.createRandom();

    const stream = createStream(senderShieldedWallet, receiverShieldedWallet);
    const checkpointTime = Math.round((stream.startTime + stream.stopTime) / 2);

    expect(
      () =>
        new Checkpoint({
          stream,
          checkpointTime,
          shieldedWallet: receiverShieldedWallet,
        }),
    ).to.not.throw();

    expect(
      () =>
        new Checkpoint({
          stream,
          checkpointTime,
          shieldedWallet: unknownShieldedWallet,
        }),
    ).to.throw();

    expect(
      () =>
        new Checkpoint({
          stream,
          checkpointTime,
          shieldedWallet: senderShieldedWallet,
        }),
    ).to.throw();
  });

  it('should encrypt', () => {
    const senderShieldedWallet = ShieldedWallet.createRandom();
    const receiverShieldedWallet = ShieldedWallet.createRandom();
    const checkpoint = createCheckpoint(senderShieldedWallet, receiverShieldedWallet);

    expect(() => checkpoint.encrypt()).to.not.throw();
  });

  it('should decrypt correctly', () => {
    const senderShieldedWallet = ShieldedWallet.createRandom();
    const receiverShieldedWallet = ShieldedWallet.createRandom();
    const originalCheckpoint = createCheckpoint(senderShieldedWallet, receiverShieldedWallet);

    const encrypted = originalCheckpoint.encrypt();

    const decrypted = Checkpoint.decrypt(encrypted, {
      stream: originalCheckpoint.stream,
      shieldedWallet: receiverShieldedWallet,
      leafIndex: 1,
    });

    expect(decrypted.checkpointTime).to.equal(originalCheckpoint.checkpointTime);
    expect(decrypted.stream.commitment).to.equal(originalCheckpoint.stream.commitment);
    expect(decrypted.blinding.eq(originalCheckpoint.blinding)).to.be.true;
  });
});
