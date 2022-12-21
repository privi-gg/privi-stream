import 'mocha';
import { expect } from 'chai';
import { utils } from 'ethers';
import { KeyPair } from './keyPair';
import { Utxo } from './utxo';

describe.only('Utxo', function () {
  const createUtxo = (senderKeyPair: KeyPair, receiverKeyPair: KeyPair) => {
    const duration = 30 * 24 * 60 * 60;
    const rate = utils.parseEther('0.00001');
    const startTime = Date.now();
    const stopTime = startTime + duration;
    const checkpointTime = startTime + duration / 2;

    return new Utxo({
      rate,
      startTime,
      stopTime,
      checkpointTime,
      senderKeyPair,
      receiverKeyPair,
    });
  };

  it('should initialize correctly', () => {
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();
    const duration = 30 * 24 * 60 * 60;
    const rate = utils.parseEther('0.00001');
    const startTime = Date.now();
    const stopTime = startTime + duration;
    const checkpointTime = startTime + duration / 2;

    expect(
      () =>
        new Utxo({
          startTime,
          stopTime,
          checkpointTime,
          rate,
          senderKeyPair,
          receiverKeyPair,
        }),
    ).to.not.throw();
  });

  it('should encrypt', () => {
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();
    const utxo = createUtxo(senderKeyPair, receiverKeyPair);
    expect(() => utxo.encrypt()).to.not.throw();
    expect(() => utxo.encrypt({ useKeyPair: 'sender' })).to.not.throw();
    expect(() => utxo.encrypt({ useKeyPair: 'receiver' })).to.not.throw();
  });

  it('should decrypt using sender key', () => {
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();
    const originalUtxo = createUtxo(senderKeyPair, receiverKeyPair);
    const encrypted1 = originalUtxo.encrypt({ useKeyPair: 'sender' });

    const utxo1 = Utxo.decrypt(encrypted1, {
      senderKeyPair,
      receiverKeyPair,
      leafIndex: 1,
      useKeyPair: 'sender',
    });

    expect(utxo1.rate.eq(originalUtxo.rate)).to.be.true;
    expect(utxo1.startTime).to.equal(originalUtxo.startTime);
    expect(utxo1.stopTime).to.equal(originalUtxo.stopTime);
    expect(utxo1.checkpointTime).to.equal(originalUtxo.checkpointTime);

    const encrypted2 = originalUtxo.encrypt({ useKeyPair: 'receiver' });

    const utxo2 = Utxo.decrypt(encrypted2, {
      senderKeyPair,
      receiverKeyPair,
      useKeyPair: 'sender',
      leafIndex: 123,
    });

    expect(utxo2.rate.eq(originalUtxo.rate)).to.be.true;
    expect(utxo2.startTime).to.equal(originalUtxo.startTime);
    expect(utxo2.stopTime).to.equal(originalUtxo.stopTime);
    expect(utxo2.checkpointTime).to.equal(originalUtxo.checkpointTime);
  });

  it('should decrypt using receiver key', () => {
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();
    const originalUtxo = createUtxo(senderKeyPair, receiverKeyPair);
    const encrypted1 = originalUtxo.encrypt({ useKeyPair: 'sender' });

    const utxo1 = Utxo.decrypt(encrypted1, {
      senderKeyPair,
      receiverKeyPair,
      leafIndex: 1,
      useKeyPair: 'receiver',
    });

    expect(utxo1.rate.eq(originalUtxo.rate)).to.be.true;
    expect(utxo1.startTime).to.equal(originalUtxo.startTime);
    expect(utxo1.stopTime).to.equal(originalUtxo.stopTime);
    expect(utxo1.checkpointTime).to.equal(originalUtxo.checkpointTime);

    const encrypted2 = originalUtxo.encrypt({ useKeyPair: 'receiver' });

    const utxo2 = Utxo.decrypt(encrypted2, {
      senderKeyPair,
      receiverKeyPair,
      leafIndex: 1,
      useKeyPair: 'receiver',
    });

    expect(utxo2.rate.eq(originalUtxo.rate)).to.be.true;
    expect(utxo2.startTime).to.equal(originalUtxo.startTime);
    expect(utxo2.stopTime).to.equal(originalUtxo.stopTime);
    expect(utxo2.checkpointTime).to.equal(originalUtxo.checkpointTime);
  });
});
