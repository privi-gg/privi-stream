import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { Utxo, KeyPair } from '@tsunami/utils';
import { deployHasher } from '../scripts/hasher';
import { deployContract, randomHex } from './helpers/utils';
import { TREE_HEIGHT } from './helpers/constants';
import { prepareProposal, prepareRevoke, prepareWithdraw } from './helpers/proofs';

const { utils } = ethers;

describe.only('Tsunami', function () {
  async function fixture() {
    const hasher = await deployHasher();
    const token = await deployContract('WETHMock');
    const proposalVerifier = await deployContract(
      'contracts/verifiers/ProposalVerifier.sol:Verifier',
    );
    const withdrawVerifier = await deployContract(
      'contracts/verifiers/WithdrawVerifier.sol:Verifier',
    );
    const revokeVerifier = await deployContract('contracts/verifiers/RevokeVerifier.sol:Verifier');
    const maxDepositAmt = utils.parseEther('100');

    const tsunami = await deployContract(
      'Tsunami',
      TREE_HEIGHT,
      maxDepositAmt,
      hasher.address,
      token.address,
      proposalVerifier.address,
      withdrawVerifier.address,
      revokeVerifier.address,
    );

    const amount = utils.parseEther('8000').toString();
    // await token.deposit({ value: amount });
    // await token.deposit({ value: amount });
    // await token.approve(tsunami.address, amount);

    return { hasher, tsunami, token };
  }

  it('start proposal works', async function () {
    const { tsunami, token } = await loadFixture(fixture);
    const [sender, receiver] = await ethers.getSigners();
    const currentTime = await time.latest();

    const duration = 10000; // in sec.
    const rate = utils.parseEther('0.0001'); // wei/sec
    const startTime = currentTime;
    const stopTime = startTime + duration;
    const depositAmount = rate.mul(duration);
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();

    const proposalUtxo = new Utxo({
      amount: depositAmount,
      startTime,
      stopTime,
      checkpointTime: startTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: proposalProofArgs, encryptedOutput } = await prepareProposal({
      output: proposalUtxo,
    });

    await tsunami.connect(sender).create(proposalProofArgs, encryptedOutput, {
      value: depositAmount,
    });
  });

  it('withdraw amount works', async function () {
    const { tsunami, token } = await loadFixture(fixture);
    const [sender, receiver] = await ethers.getSigners();
    const currentTime = await time.latest();

    const duration = 10000; // in sec.
    const rate = utils.parseEther('0.0001'); // wei/sec
    const startTime = currentTime;
    const stopTime = startTime + duration;
    const depositAmount = rate.mul(duration);
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();

    const proposalUtxo = new Utxo({
      amount: depositAmount,
      startTime,
      stopTime,
      checkpointTime: startTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: proposalProofArgs, encryptedOutput } = await prepareProposal({
      output: proposalUtxo,
    });

    await tsunami.connect(sender).create(proposalProofArgs, encryptedOutput, {
      value: depositAmount,
    });

    // 5000 sec passed
    await time.increaseTo(startTime + 5000);

    const withdraw1Duration = 4000;
    const withdraw1Amount = rate.mul(withdraw1Duration);
    const checkpoint1Time = startTime + withdraw1Duration;
    const recipient = randomHex(20);

    const newUtxo1 = new Utxo({
      amount: proposalUtxo.amount,
      startTime,
      stopTime,
      checkpointTime: checkpoint1Time,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: proofArgs1, extData: extData1 } = await prepareWithdraw({
      pool: tsunami,
      input: proposalUtxo,
      output: newUtxo1,
      recipient,
      checkpointTime: checkpoint1Time,
    });

    const spent = await tsunami.isSpent(proofArgs1.inputNullifier);
    expect(spent).to.be.equal(false);

    await tsunami.withdraw(proofArgs1, extData1);

    const balance1 = await ethers.provider.getBalance(recipient); // await token.balanceOf(recipient);
    expect(balance1).to.equal(withdraw1Amount);

    // 8000 sec passed
    await time.increaseTo(startTime + 8000);

    const withdraw2Duration = 3000;
    const withdraw2Amount = rate.mul(withdraw2Duration);
    const checkpoint2Time = checkpoint1Time + withdraw2Duration;

    const newUtxo2 = new Utxo({
      amount: proposalUtxo.amount,
      startTime,
      stopTime,
      checkpointTime: checkpoint2Time,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: proofArgs2, extData: extData2 } = await prepareWithdraw({
      pool: tsunami,
      input: newUtxo1,
      output: newUtxo2,
      recipient,
      checkpointTime: checkpoint2Time,
    });

    await tsunami.withdraw(proofArgs2, extData2);
    const balance2 = await ethers.provider.getBalance(recipient); // await token.balanceOf(recipient);
    expect(balance2).to.equal(balance1.add(withdraw2Amount));
  });

  it('revoke works', async function () {
    const { tsunami, token } = await loadFixture(fixture);
    const [sender, receiver] = await ethers.getSigners();
    const currentTime = await time.latest();

    const duration = 10000; // in sec.
    const rate = utils.parseEther('0.0001'); // wei/sec
    const streamAmount = rate.mul(duration);
    const startTime = currentTime;
    const stopTime = startTime + duration;
    const checkpointTime = startTime;
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();

    const proposalUtxo = new Utxo({
      amount: streamAmount,
      startTime,
      stopTime,
      checkpointTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: proposalProofArgs, encryptedOutput } = await prepareProposal({
      output: proposalUtxo,
    });

    await tsunami.connect(sender).create(proposalProofArgs, encryptedOutput, {
      value: streamAmount,
    });

    // 5000 sec passed
    await time.increaseTo(startTime + 5000);

    const revokeStopTime = startTime + 5000 + 500;
    const senderWithdrawAmount = rate.mul(stopTime - revokeStopTime);
    const senderRecipient = randomHex(20);

    const revokeUtxo = new Utxo({
      amount: streamAmount,
      startTime,
      stopTime: revokeStopTime,
      checkpointTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: revokeProofArgs, extData: extData } = await prepareRevoke({
      pool: tsunami,
      input: proposalUtxo,
      output: revokeUtxo,
      recipient: senderRecipient,
    });

    await tsunami.revoke(revokeProofArgs, extData);

    const balance1 = await ethers.provider.getBalance(senderRecipient); // await token.balanceOf(senderRecipient);
    expect(balance1).to.equal(senderWithdrawAmount);

    // Pass revoked stop time
    await time.increaseTo(revokeStopTime + 10);

    const receiverWithdrawAmount = rate.mul(revokeStopTime - checkpointTime);
    const receiverRecipient = randomHex(20);
    const withdrawUtxo = new Utxo({
      amount: streamAmount,
      startTime,
      stopTime: revokeStopTime,
      checkpointTime: revokeStopTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: withdrawProofArgs, extData: withdrawExtData } = await prepareWithdraw({
      pool: tsunami,
      input: revokeUtxo,
      output: withdrawUtxo,
      recipient: receiverRecipient,
    });

    await tsunami.withdraw(withdrawProofArgs, withdrawExtData);

    const balance2 = await ethers.provider.getBalance(receiverRecipient); //await token.balanceOf(receiverRecipient);
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
    const depositAmount = rate.mul(duration);
    const [senderKeyPair, receiverKeyPair] = KeyPair.createRandomPairs();

    const proposalUtxo = new Utxo({
      amount: depositAmount,
      startTime,
      stopTime,
      checkpointTime: startTime,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: proposalProofArgs, encryptedOutput } = await prepareProposal({
      output: proposalUtxo,
    });

    await tsunami.connect(sender).create(proposalProofArgs, encryptedOutput, {
      value: depositAmount,
    });

    // 4000 sec passed
    await time.increaseTo(startTime + 4000);

    const withdraw1Duration = 3000;
    const receiverWithdraw1Amount = rate.mul(withdraw1Duration);
    const checkpoint1Time = startTime + withdraw1Duration;
    const receiverRecipient = randomHex(20);

    const withdrawUtxo = new Utxo({
      amount: proposalUtxo.amount,
      startTime,
      stopTime,
      checkpointTime: checkpoint1Time,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: withdrawProofArgs, extData: withdrawExtData } = await prepareWithdraw({
      pool: tsunami,
      input: proposalUtxo,
      output: withdrawUtxo,
      recipient: receiverRecipient,
    });

    const spent = await tsunami.isSpent(withdrawProofArgs.inputNullifier);
    expect(spent).to.be.equal(false);

    await tsunami.withdraw(withdrawProofArgs, withdrawExtData);

    const balance1 = await ethers.provider.getBalance(receiverRecipient); // await token.balanceOf(receiverRecipient);
    expect(balance1).to.equal(receiverWithdraw1Amount);

    // 7000 sec passed
    await time.increaseTo(startTime + 7000);

    const revokeStopTime = startTime + 7000 + 500;

    const senderWithdrawAmount = rate.mul(stopTime - revokeStopTime);

    const senderRecipient = randomHex(20);
    const revokeUtxo = new Utxo({
      amount: proposalUtxo.amount,
      startTime,
      stopTime: revokeStopTime,
      checkpointTime: checkpoint1Time,
      rate,
      senderKeyPair,
      receiverKeyPair,
    });

    const { proofArgs: revokeProofArgs, extData: revokeExtData } = await prepareRevoke({
      pool: tsunami,
      input: withdrawUtxo,
      output: revokeUtxo,
      recipient: senderRecipient,
    });

    await tsunami.revoke(revokeProofArgs, revokeExtData);
    const balance2 = await ethers.provider.getBalance(senderRecipient); // await token.balanceOf(senderRecipient);
    expect(balance2).to.equal(senderWithdrawAmount);
  });
});
