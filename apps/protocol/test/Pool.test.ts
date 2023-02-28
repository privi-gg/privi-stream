import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { randomBN } from 'privi-utils';
import { Stream, ShieldedWallet, Checkpoint } from '@privi-stream/common';
import { deployContract } from './helpers/utils';
import { prepareCreate, prepareWithdraw } from './helpers/proofs';
import { deployHasher } from './helpers/hasher';
import { CHECKPOINT_TREE_LEVELS, STREAM_TREE_LEVELS } from './helpers/constants';

const { utils } = ethers;

describe.only('Pool', function () {
  async function setUpFixture() {
    const hasher = await deployHasher();
    const token = await deployContract('WTokenMock');
    const createVerifier = await deployContract('contracts/verifiers/CreateVerifier.sol:Verifier');
    const withdrawVerifier = await deployContract(
      'contracts/verifiers/CheckpointVerifier.sol:Verifier',
    );
    const revokeVerifier = await deployContract('contracts/verifiers/RevokeVerifier.sol:Verifier');
    const sanctionsList = await deployContract('SanctionsListMock');

    const poolImpl = await deployContract(
      'Pool',
      token.address,
      hasher.address,
      sanctionsList.address,
      createVerifier.address,
      withdrawVerifier.address,
      revokeVerifier.address,
    );
    const { data: initializeData } = await poolImpl.populateTransaction.initialize(
      STREAM_TREE_LEVELS,
      CHECKPOINT_TREE_LEVELS,
    );
    const poolProxy = await deployContract('PoolProxyMock', poolImpl.address, initializeData);
    const pool = poolImpl.attach(poolProxy.address);

    const amount = utils.parseEther('8000').toString();
    await token.deposit({ value: amount });
    await token.approve(pool.address, amount);

    return { hasher, pool, token, poolImpl, poolProxy };
  }

  async function createdStreamFixture() {
    const { pool, hasher, token, poolImpl, poolProxy } = await loadFixture(setUpFixture);

    const duration = 100000; // in sec.
    const rate = utils.parseEther('0.00001');
    const startTime = await time.latest();
    const stopTime = startTime + duration;
    const senderSw = ShieldedWallet.createRandom();
    const receiverSw = ShieldedWallet.createRandom();

    const stream = new Stream({
      rate,
      startTime,
      stopTime,
      senderShieldedWallet: senderSw,
      receiverShieldedWallet: receiverSw,
    });

    const { proofArgs, createData } = await prepareCreate({
      output: stream,
    });

    await pool.create(proofArgs, createData);

    return { pool, hasher, token, stream, poolImpl, poolProxy };
  }

  it('create stream works', async function () {
    const { pool } = await loadFixture(setUpFixture);

    const duration = 10000; // in sec.
    const rate = utils.parseEther('0.0001');
    const startTime = await time.latest();
    const stopTime = startTime + duration;
    const senderSw = ShieldedWallet.createRandom();
    const receiverSw = ShieldedWallet.createRandom();

    const stream = new Stream({
      rate,
      startTime,
      stopTime,
      senderShieldedWallet: senderSw,
      receiverShieldedWallet: receiverSw,
    });

    const { proofArgs, createData } = await prepareCreate({
      output: stream,
    });

    await pool.create(proofArgs, createData);
  });

  it('withdraw stream works', async function () {
    const { pool, stream, token } = await loadFixture(createdStreamFixture);

    const recipient = randomBN(20).toHexString();

    // Half duration passed
    const checkpointTime = stream.startTime + Math.round(stream.duration / 2);
    await time.increaseTo(checkpointTime + 100);

    const checkpoint = new Checkpoint({
      stream,
      checkpointTime,
      shieldedWallet: stream.receiverShieldedWallet,
    });

    const currentTime = await time.latest();

    const { proofArgs, extData } = await prepareWithdraw({
      pool,
      input: Checkpoint.zero(stream),
      output: checkpoint,
      currentTime,
      recipient: recipient,
    });

    await pool.withdraw(proofArgs, extData);
    const withdrawAmount = stream.rate.mul(checkpointTime - stream.startTime);

    const balance = await token.balanceOf(recipient);
    expect(balance).to.equal(withdrawAmount);
  });

  it('multiple withdraws from stream works', async function () {
    const { pool, stream, token } = await loadFixture(createdStreamFixture);

    const recipient = randomBN(20).toHexString();

    // 1/3 of duration passed
    const checkpoint1Time = stream.startTime + Math.round(stream.duration / 3);
    await time.increaseTo(checkpoint1Time + 100);
    const checkpoint1 = new Checkpoint({
      stream,
      checkpointTime: checkpoint1Time,
      shieldedWallet: stream.receiverShieldedWallet,
    });
    let currentTime = await time.latest();
    const { proofArgs: args1, extData: data1 } = await prepareWithdraw({
      pool,
      input: Checkpoint.zero(stream),
      output: checkpoint1,
      currentTime,
      recipient,
    });

    await pool.withdraw(args1, data1);
    const withdrawAmount1 = stream.rate.mul(checkpoint1Time - stream.startTime);
    let balance = await token.balanceOf(recipient);
    expect(balance).to.equal(withdrawAmount1);

    // 2/3 of duration passed
    const checkpoint2Time = stream.startTime + Math.round((stream.duration * 2) / 3);
    await time.increaseTo(checkpoint2Time + 100);
    const checkpoint2 = new Checkpoint({
      stream,
      checkpointTime: checkpoint2Time,
      shieldedWallet: stream.receiverShieldedWallet,
    });
    currentTime = await time.latest();
    const { proofArgs: args2, extData: data2 } = await prepareWithdraw({
      pool,
      input: checkpoint1,
      output: checkpoint2,
      currentTime,
      recipient,
    });

    await pool.withdraw(args2, data2);
    const withdrawAmount2 = stream.rate.mul(checkpoint2Time - checkpoint1Time);
    balance = await token.balanceOf(recipient);
    expect(balance).to.equal(withdrawAmount1.add(withdrawAmount2));

    // 3/3 of duration passed
    const checkpoint3Time = stream.startTime + stream.duration;
    await time.increaseTo(checkpoint3Time + 100);
    const checkpoint3 = new Checkpoint({
      stream,
      checkpointTime: checkpoint3Time,
      shieldedWallet: stream.receiverShieldedWallet,
    });
    currentTime = await time.latest();
    const { proofArgs: args3, extData: data3 } = await prepareWithdraw({
      pool,
      input: checkpoint2,
      output: checkpoint3,
      currentTime,
      recipient,
    });

    await pool.withdraw(args3, data3);
    const withdrawAmount3 = stream.rate.mul(checkpoint3Time - checkpoint2Time);
    balance = await token.balanceOf(recipient);

    expect(stream.amount).to.equal(balance);
    expect(balance).to.equal(withdrawAmount1.add(withdrawAmount2).add(withdrawAmount3));
  });

  it('should not be able to re-use zero checkpoint', async function () {
    const { pool, stream, token, poolImpl, poolProxy } = await loadFixture(createdStreamFixture);

    const recipient = randomBN(20).toHexString();
    const zeroCheckpoint = Checkpoint.zero(stream);
    let currentTime;

    const checkpointTime = stream.startTime + Math.round(stream.duration / 2);
    await time.increaseTo(checkpointTime + 100);
    currentTime = await time.latest();

    const checkpoint1 = new Checkpoint({
      stream,
      checkpointTime: checkpointTime,
      shieldedWallet: stream.receiverShieldedWallet,
    });
    const { proofArgs: args1, extData: data1 } = await prepareWithdraw({
      pool,
      input: zeroCheckpoint,
      output: checkpoint1,
      currentTime,
      recipient,
    });

    await pool.withdraw(args1, data1);
    const withdrawAmount1 = stream.rate.mul(checkpointTime - stream.startTime);
    let balance = await token.balanceOf(recipient);
    expect(balance).to.equal(withdrawAmount1);

    const checkpoint2Time = checkpointTime;

    currentTime = await time.latest();
    const checkpoint2 = new Checkpoint({
      stream,
      checkpointTime: checkpoint2Time,
      shieldedWallet: stream.receiverShieldedWallet,
    });
    const { proofArgs: args2, extData: data2 } = await prepareWithdraw({
      pool,
      input: zeroCheckpoint,
      output: checkpoint2,
      currentTime,
      recipient,
    });

    await expect(pool.withdraw(args2, data2)).to.be.reverted;
  });
});
