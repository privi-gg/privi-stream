import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { Utxo, KeyPair } from '@privi-stream/common';
import { deployHasher } from '../scripts/hasher';
import { deployContract, randomHex } from './helpers/utils';
import { TREE_HEIGHT } from './helpers/constants';
import { prepareCreate, prepareRevoke, prepareWithdraw } from './helpers/proofs';

const { utils } = ethers;

describe('Tsunami', function () {
  async function fixture() {
    const hasher = await deployHasher();
    const token = await deployContract('WETHMock');
    const createVerifier = await deployContract('contracts/verifiers/CreateVerifier.sol:Verifier');
    const withdrawVerifier = await deployContract(
      'contracts/verifiers/WithdrawVerifier.sol:Verifier',
    );
    const revokeVerifier = await deployContract('contracts/verifiers/RevokeVerifier.sol:Verifier');
    const maxDepositAmt = utils.parseEther('100');

    const tsunami = await deployContract(
      'Tsunami',
      TREE_HEIGHT,
      maxDepositAmt,
      token.address,
      hasher.address,
      createVerifier.address,
      withdrawVerifier.address,
      revokeVerifier.address,
    );

    const amount = utils.parseEther('8000').toString();
    await token.deposit({ value: amount });
    await token.approve(tsunami.address, amount);

    return { hasher, tsunami, token };
  }

  it('create stream works', async function () {
    const { tsunami, token } = await loadFixture(fixture);
    const [sender, receiver] = await ethers.getSigners();
    const currentTime = await time.latest();

    const duration = 10000; // in sec.
    const rate = utils.parseEther('0.0001');
    const startTime = currentTime;
    const stopTime = startTime + duration;
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();

    const createUtxo = new Utxo({
      startTime,
      stopTime,
      checkpointTime: startTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: createProofArgs, encryptedOutput } = await prepareCreate({
      output: createUtxo,
    });

    await tsunami.connect(sender).create(createProofArgs, encryptedOutput);
  });

  it('withdraw amount from stream works', async function () {
    const { tsunami, token } = await loadFixture(fixture);
    const [sender, receiver] = await ethers.getSigners();
    const currentTime = await time.latest();

    const duration = 10000; // in sec.
    const rate = utils.parseEther('0.0001'); // wei/sec
    const startTime = currentTime;
    const stopTime = startTime + duration;
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();

    const createUtxo = new Utxo({
      startTime,
      stopTime,
      checkpointTime: startTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: createProofArgs, encryptedOutput } = await prepareCreate({
      output: createUtxo,
    });

    await tsunami.connect(sender).create(createProofArgs, encryptedOutput);

    // 5000 sec passed
    await time.increaseTo(startTime + 5000);

    const withdrawDuration = 4000;
    const withdrawAmount = rate.mul(withdrawDuration);
    const withdrawCheckpointTime = startTime + withdrawDuration;
    const recipient = randomHex(20);

    const withdrawUtxo = createUtxo.withdraw(withdrawCheckpointTime);

    const { proofArgs: proofArgs1, extData: extData1 } = await prepareWithdraw({
      tsunami,
      input: createUtxo,
      output: withdrawUtxo,
      recipient,
      checkpointTime: withdrawCheckpointTime,
    });

    const spent = await tsunami.isSpent(proofArgs1.inputNullifier);
    expect(spent).to.be.equal(false);

    await tsunami.withdraw(proofArgs1, extData1);

    const balance1 = await token.balanceOf(recipient);
    expect(balance1).to.equal(withdrawAmount);

    // 8000 sec passed
    await time.increaseTo(startTime + 8000);

    const withdraw2Duration = 3000;
    const withdraw2Amount = rate.mul(withdraw2Duration);
    const withdrawCheckpoint2Time = withdrawCheckpointTime + withdraw2Duration;

    const newUtxo2 = new Utxo({
      startTime,
      stopTime,
      checkpointTime: withdrawCheckpoint2Time,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: proofArgs2, extData: extData2 } = await prepareWithdraw({
      tsunami,
      input: withdrawUtxo,
      output: newUtxo2,
      recipient,
    });

    await tsunami.withdraw(proofArgs2, extData2);
    const balance2 = await token.balanceOf(recipient);
    expect(balance2).to.equal(balance1.add(withdraw2Amount));
  });

  it('revoke stream works', async function () {
    const { tsunami, token } = await loadFixture(fixture);
    const [sender, receiver] = await ethers.getSigners();
    const currentTime = await time.latest();

    const duration = 10000; // in sec.
    const rate = utils.parseEther('0.0001');
    const startTime = currentTime;
    const stopTime = startTime + duration;
    const checkpointTime = startTime;
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();

    const createUtxo = new Utxo({
      startTime,
      stopTime,
      checkpointTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: createProofArgs, encryptedOutput } = await prepareCreate({
      output: createUtxo,
    });

    await tsunami.connect(sender).create(createProofArgs, encryptedOutput);

    // 5000 sec passed
    await time.increaseTo(startTime + 5000);

    const revokeStopTime = startTime + 5000 + 500;
    const senderWithdrawAmount = rate.mul(stopTime - revokeStopTime);
    const senderRecipient = randomHex(20);

    const revokeUtxo = createUtxo.revoke(revokeStopTime);

    const { proofArgs: revokeProofArgs, extData: extData } = await prepareRevoke({
      tsunami,
      input: createUtxo,
      output: revokeUtxo,
      recipient: senderRecipient,
    });

    await tsunami.revoke(revokeProofArgs, extData);

    const balance1 = await token.balanceOf(senderRecipient);
    expect(balance1).to.equal(senderWithdrawAmount);

    // Pass revoked stop time
    await time.increaseTo(revokeStopTime + 10);

    const receiverWithdrawAmount = rate.mul(revokeStopTime - checkpointTime);
    const receiverRecipient = randomHex(20);

    const withdrawUtxo = revokeUtxo.withdraw(revokeStopTime);

    const { proofArgs: withdrawProofArgs, extData: withdrawExtData } = await prepareWithdraw({
      tsunami,
      input: revokeUtxo,
      output: withdrawUtxo,
      recipient: receiverRecipient,
    });

    await tsunami.withdraw(withdrawProofArgs, withdrawExtData);

    const balance2 = await token.balanceOf(receiverRecipient);
    expect(balance2).to.equal(receiverWithdrawAmount);
  });

  it('revoke agreement works 2', async function () {
    const { tsunami, token } = await loadFixture(fixture);
    const [sender, receiver] = await ethers.getSigners();
    const currentTime = await time.latest();

    const duration = 10000; // in sec.
    const rate = utils.parseEther('0.0001'); // wei/sec
    const startTime = currentTime;
    const stopTime = startTime + duration;
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();

    const createUtxo = new Utxo({
      startTime,
      stopTime,
      checkpointTime: startTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: createProofArgs, encryptedOutput } = await prepareCreate({
      output: createUtxo,
    });

    await tsunami.connect(sender).create(createProofArgs, encryptedOutput);

    // 4000 sec passed
    await time.increaseTo(startTime + 4000);

    const withdraw1Duration = 3000;
    const receiverWithdraw1Amount = rate.mul(withdraw1Duration);
    const withdrawCheckpoint1Time = startTime + withdraw1Duration;
    const receiverRecipient = randomHex(20);

    const withdrawUtxo = new Utxo({
      startTime,
      stopTime,
      checkpointTime: withdrawCheckpoint1Time,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: withdrawProofArgs, extData: withdrawExtData } = await prepareWithdraw({
      tsunami,
      input: createUtxo,
      output: withdrawUtxo,
      recipient: receiverRecipient,
    });

    const spent = await tsunami.isSpent(withdrawProofArgs.inputNullifier);
    expect(spent).to.be.equal(false);

    await tsunami.withdraw(withdrawProofArgs, withdrawExtData);

    const balance1 = await token.balanceOf(receiverRecipient);
    expect(balance1).to.equal(receiverWithdraw1Amount);

    // 7000 sec passed
    await time.increaseTo(startTime + 7000);

    const revokeStopTime = startTime + 7000 + 500;

    const senderWithdrawAmount = rate.mul(stopTime - revokeStopTime);

    const senderRecipient = randomHex(20);
    const revokeUtxo = new Utxo({
      startTime,
      stopTime: revokeStopTime,
      checkpointTime: withdrawCheckpoint1Time,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: revokeProofArgs, extData: revokeExtData } = await prepareRevoke({
      tsunami,
      input: withdrawUtxo,
      output: revokeUtxo,
      recipient: senderRecipient,
    });

    await tsunami.revoke(revokeProofArgs, revokeExtData);
    const balance2 = await token.balanceOf(senderRecipient);
    expect(balance2).to.equal(senderWithdrawAmount);
  });
});
