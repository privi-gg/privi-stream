import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, getNewCheckpointTree, getNewStreamTree } from './helpers/utils';
import { deployHasher } from './helpers/hasher';
import { poseidonHash, toFixedHex } from 'privi-utils';

const STREAM_TREE_HEIGHT = 18;
const CHECKPOINT_TREE_HEIGHT = 20;

describe('MerkleTrees', function () {
  this.timeout(20000);

  async function fixture() {
    const hasher = await deployHasher();
    const merkleTrees = await deployContract('MerkleTreesMock', hasher.address);

    await merkleTrees.initialize(STREAM_TREE_HEIGHT, CHECKPOINT_TREE_HEIGHT);

    return { hasher, merkleTrees };
  }

  describe('Initialization', () => {
    it('should initialize correctly', async () => {
      const { merkleTrees } = await loadFixture(fixture);
      const zeroStreamLeaf = await merkleTrees.ZERO_LEAF_STREAM();
      const zeroCheckpointLeaf = await merkleTrees.ZERO_LEAF_CHECKPOINT();

      const zeroNodeStream = await merkleTrees.getStreamZeroNode(0);
      const zeroNodeCheckpoint = await merkleTrees.getCheckpointZeroNode(0);

      const streamSubtreeNode = await merkleTrees.getStreamSubtreeNode(0);
      const checkpointSubtreeNode = await merkleTrees.getCheckpointSubtreeNode(0);

      expect(zeroNodeStream).to.be.equal(zeroStreamLeaf);
      expect(zeroNodeCheckpoint).to.be.equal(zeroCheckpointLeaf);

      expect(streamSubtreeNode).to.be.equal(zeroStreamLeaf);
      expect(checkpointSubtreeNode).to.be.equal(zeroCheckpointLeaf);
    });

    it('should correctly hash 2 leaves', async () => {
      const { merkleTrees } = await loadFixture(fixture);
      const hash0 = await merkleTrees.hashLeaves(toFixedHex(123), toFixedHex(456));

      const hash2 = poseidonHash(123, 456);
      expect(hash0).to.equal(hash2);
    });

    it('should have correct initial merkle root', async () => {
      const { merkleTrees } = await loadFixture(fixture);
      const streamTree = getNewStreamTree(STREAM_TREE_HEIGHT);
      const checkpointTree = getNewCheckpointTree(CHECKPOINT_TREE_HEIGHT);

      const streamRoot = await merkleTrees.getLastStreamRoot();
      const checkpointRoot = await merkleTrees.getLastCheckpointRoot();

      expect(streamTree.root).to.equal(streamRoot);
      expect(checkpointTree.root).to.equal(checkpointRoot);
    });
  });

  describe('Insertion', () => {
    it('should insert correctly', async () => {
      const { merkleTrees } = await loadFixture(fixture);
      const streamTree = getNewStreamTree(STREAM_TREE_HEIGHT);
      const checkpointTree = getNewCheckpointTree(CHECKPOINT_TREE_HEIGHT);

      streamTree.bulkInsert([123]);
      checkpointTree.bulkInsert([234]);
      await merkleTrees.insertStream(toFixedHex(123));
      await merkleTrees.insertCheckpoint(toFixedHex(234));

      expect(streamTree.root).to.be.equal(await merkleTrees.getLastStreamRoot());
      expect(checkpointTree.root).to.be.equal(await merkleTrees.getLastCheckpointRoot());

      streamTree.bulkInsert([678]);
      checkpointTree.bulkInsert([789]);
      await merkleTrees.insertStream(toFixedHex(678));
      await merkleTrees.insertCheckpoint(toFixedHex(789));

      expect(streamTree.root).to.be.equal(await merkleTrees.getLastStreamRoot());
      expect(checkpointTree.root).to.be.equal(await merkleTrees.getLastCheckpointRoot());
    });
  });

  describe('Tree root', () => {
    async function fixtureFilled() {
      const { merkleTrees, hasher } = await loadFixture(fixture);
      await merkleTrees.insertStream(toFixedHex(123));
      await merkleTrees.insertCheckpoint(toFixedHex(456));
      return { merkleTrees, hasher };
    }

    it('should return last root', async () => {
      const { merkleTrees } = await fixtureFilled();
      const streamTree = getNewStreamTree(STREAM_TREE_HEIGHT);
      const checkpointTree = getNewCheckpointTree(CHECKPOINT_TREE_HEIGHT);

      streamTree.bulkInsert([123]);
      checkpointTree.bulkInsert([456]);

      const streamRoot = toFixedHex(streamTree.root);
      const checkpointRoot = toFixedHex(checkpointTree.root);

      expect(await merkleTrees.hasKnownStreamRoot(streamRoot)).to.equal(true);
      expect(await merkleTrees.hasKnownCheckpointRoot(checkpointRoot)).to.equal(true);
    });

    it('should return older root', async () => {
      const { merkleTrees } = await fixtureFilled();
      const streamTree = getNewStreamTree(STREAM_TREE_HEIGHT);
      const checkpointTree = getNewCheckpointTree(CHECKPOINT_TREE_HEIGHT);

      streamTree.bulkInsert([123]);
      checkpointTree.bulkInsert([456]);
      await merkleTrees.insertStream(toFixedHex(123));
      await merkleTrees.insertCheckpoint(toFixedHex(456));

      const streamRoot = toFixedHex(streamTree.root);
      const checkpointRoot = toFixedHex(checkpointTree.root);

      await merkleTrees.insertStream(toFixedHex(678));
      await merkleTrees.insertCheckpoint(toFixedHex(789));

      expect(await merkleTrees.hasKnownStreamRoot(streamRoot)).to.equal(true);
      expect(await merkleTrees.hasKnownCheckpointRoot(checkpointRoot)).to.equal(true);
    });

    it('should fail on unknown root', async () => {
      const { merkleTrees } = await fixtureFilled();
      const streamTree = getNewStreamTree(STREAM_TREE_HEIGHT);
      const checkpointTree = getNewCheckpointTree(CHECKPOINT_TREE_HEIGHT);

      streamTree.bulkInsert([678]);
      checkpointTree.bulkInsert([789]);

      const streamRoot = toFixedHex(streamTree.root);
      const checkpointRoot = toFixedHex(checkpointTree.root);

      expect(await merkleTrees.hasKnownStreamRoot(streamRoot)).to.equal(false);
      expect(await merkleTrees.hasKnownCheckpointRoot(checkpointRoot)).to.equal(false);
    });

    it('should not return uninitialized roots', async () => {
      const { merkleTrees } = await fixtureFilled();

      expect(await merkleTrees.hasKnownStreamRoot(toFixedHex(0))).to.equal(false);
      expect(await merkleTrees.hasKnownCheckpointRoot(toFixedHex(0))).to.equal(false);
    });
  });
});
