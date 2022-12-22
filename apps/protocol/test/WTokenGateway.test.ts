import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { Utxo, KeyPair } from '@tsunami/utils';
import { deployHasher } from '../scripts/hasher';
import { deployContract, randomHex } from './helpers/utils';
import { TREE_HEIGHT } from './helpers/constants';
import { prepareCreate, prepareRevoke, prepareWithdraw } from './helpers/proofs';

const { utils } = ethers;

describe('WTokenGateway', function () {
  async function fixture() {
    const hasher = await deployHasher();
    const weth = await deployContract('WETHMock');
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
      weth.address,
      hasher.address,
      createVerifier.address,
      withdrawVerifier.address,
      revokeVerifier.address,
    );
    const wethGateway = await deployContract('WTokenGateway', weth.address);

    const amount = utils.parseEther('8000').toString();
    await weth.deposit({ value: amount });
    await weth.approve(tsunami.address, amount);

    return { hasher, tsunami, weth, wethGateway };
  }

  it('create works', async function () {
    const { tsunami, wethGateway, weth } = await loadFixture(fixture);
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

    await wethGateway.create(tsunami.address, createProofArgs, encryptedOutput, {
      value: createProofArgs.publicAmount,
    });
  });

  it('withdraw works', async function () {
    const { tsunami, weth, wethGateway } = await loadFixture(fixture);
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

    await wethGateway.create(tsunami.address, createProofArgs, encryptedOutput, {
      value: createProofArgs.publicAmount,
    });

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
      recipient: wethGateway.address,
    });

    const spent = await tsunami.isSpent(proofArgs1.inputNullifier);
    expect(spent).to.be.equal(false);

    await wethGateway.withdraw(tsunami.address, recipient, proofArgs1, extData1);

    const balance1 = await ethers.provider.getBalance(recipient);
    expect(balance1).to.equal(withdrawAmount);
  });

  it('revoke works', async function () {
    const { tsunami, wethGateway } = await loadFixture(fixture);
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

    await wethGateway.create(tsunami.address, createProofArgs, encryptedOutput, {
      value: createProofArgs.publicAmount,
    });

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
      recipient: wethGateway.address,
    });

    await wethGateway.revoke(tsunami.address, senderRecipient, revokeProofArgs, extData);

    const balance1 = await ethers.provider.getBalance(senderRecipient);
    expect(balance1).to.equal(senderWithdrawAmount);
  });
});
