import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-network-helpers';
import { prepareCreate, prepareWithdraw } from './helpers/proofs';
import { deployHasher } from './helpers/hasher';
import { deployContract } from './helpers/utils';
import { CHECKPOINT_TREE_LEVELS, STREAM_TREE_LEVELS } from './helpers/constants';
import { Checkpoint, ShieldedWallet, Stream } from '@privi-stream/common';
import { randomHex } from 'privi-utils';

const { utils } = ethers;

describe('WTokenGateway', function () {
  async function setUpFixture() {
    const hasher = await deployHasher();
    const token = await deployContract('WTokenMock');
    const createVerifier = await deployContract('contracts/verifiers/CreateVerifier.sol:Verifier');
    const withdrawVerifier = await deployContract(
      'contracts/verifiers/CheckpointVerifier.sol:Verifier',
    );
    const sanctionsList = await deployContract('SanctionsListMock');

    const poolImpl = await deployContract(
      'Pool',
      token.address,
      hasher.address,
      sanctionsList.address,
      createVerifier.address,
      withdrawVerifier.address,
    );
    const { data: initializeData } = await poolImpl.populateTransaction.initialize(
      STREAM_TREE_LEVELS,
      CHECKPOINT_TREE_LEVELS,
    );
    const poolProxy = await deployContract('PoolProxyMock', poolImpl.address, initializeData);
    const pool = poolImpl.attach(poolProxy.address);

    const wTokenGateway = await deployContract('WTokenGateway', token.address);

    const amount = utils.parseEther('8000').toString();
    await token.deposit({ value: amount });
    await token.approve(pool.address, amount);

    return { hasher, pool, token, poolImpl, poolProxy, wTokenGateway };
  }

  it('create works', async function () {
    const { pool, wTokenGateway, token } = await loadFixture(setUpFixture);

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

    await wTokenGateway.create(pool.address, proofArgs, createData, {
      value: proofArgs.publicAmount,
    });

    const poolBalance = await token.balanceOf(pool.address);
    expect(poolBalance).to.equal(proofArgs.publicAmount);
  });

  it('withdraw works', async function () {
    const { pool, wTokenGateway } = await loadFixture(setUpFixture);

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

    const { proofArgs: createProofArgs, createData } = await prepareCreate({
      output: stream,
    });

    await pool.create(createProofArgs, createData);

    await wTokenGateway.create(pool.address, createProofArgs, createData, {
      value: createProofArgs.publicAmount,
    });

    // half duration passed
    const recipient = randomHex(20);
    const checkpointTime = stream.startTime + Math.round(stream.duration / 2);
    await time.increaseTo(checkpointTime + 100);

    const checkpoint = new Checkpoint({
      stream,
      checkpointTime,
      shieldedWallet: stream.receiverShieldedWallet,
    });

    const currentTime = await time.latest();

    const { proofArgs: withdrawProofArgs, extData } = await prepareWithdraw({
      pool,
      input: Checkpoint.zero(stream),
      output: checkpoint,
      currentTime,
      recipient: wTokenGateway.address,
    });

    const withdrawAmount = stream.rate.mul(checkpointTime - stream.startTime);

    await wTokenGateway.withdraw(pool.address, recipient, withdrawProofArgs, extData);

    const balance = await ethers.provider.getBalance(recipient);
    expect(balance).to.equal(withdrawAmount);
  });
});
