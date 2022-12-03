import { expect } from 'chai';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { deployContract, getNewTree, poseidonHash, toFixedHex } from './helpers/utils';
import { TREE_HEIGHT } from './helpers/constants';
import { deployHasher } from '../scripts/hasher';

describe('CommitmentTree', function () {
  this.timeout(20000);

  async function fixture() {
    const hasher = await deployHasher();
    const commitmentTree = await deployContract('MerkleTreeMock', TREE_HEIGHT, hasher.address);
    return { hasher, commitmentTree };
  }

  describe('#constructor', () => {
    it('should initialize', async () => {
      const { commitmentTree } = await loadFixture(fixture);
      const zeroValue = await commitmentTree.ZERO_VALUE();
      const firstSubtree = await commitmentTree.filledSubtrees(0);
      const firstZero = await commitmentTree.zeros(0);
      expect(firstSubtree).to.be.equal(zeroValue);
      expect(firstZero).to.be.equal(zeroValue);
    });

    it('should correctly hash 2 leaves', async () => {
      const { commitmentTree } = await loadFixture(fixture);
      const hash0 = await commitmentTree.hashLeftRight(toFixedHex(123), toFixedHex(456));

      const hash2 = poseidonHash(123, 456);
      expect(hash0).to.equal(hash2);
    });

    it('should have correct initial merkle root', async () => {
      const { commitmentTree } = await loadFixture(fixture);
      const tree = getNewTree();
      const contractRoot = await commitmentTree.getLastRoot();
      expect(tree.root).to.equal(contractRoot);
    });
  });

  describe('#insert', () => {
    it('should insert', async () => {
      const { commitmentTree } = await loadFixture(fixture);
      const tree = getNewTree();
      await commitmentTree.insert(toFixedHex(123));
      tree.bulkInsert([123]);
      expect(tree.root).to.be.equal(await commitmentTree.getLastRoot());

      await commitmentTree.insert(toFixedHex(678));
      tree.bulkInsert([678]);
      expect(tree.root).to.be.equal(await commitmentTree.getLastRoot());
    });
  });

  describe('#isKnownRoot', () => {
    async function fixtureFilled() {
      const { commitmentTree, hasher } = await loadFixture(fixture);
      await commitmentTree.insert(toFixedHex(123));
      return { commitmentTree, hasher };
    }

    it('should return last root', async () => {
      const { commitmentTree } = await fixtureFilled();
      const tree = getNewTree();
      tree.bulkInsert([123]);
      const root = toFixedHex(tree.root);
      expect(await commitmentTree.isKnownRoot(root)).to.equal(true);
    });

    it('should return older root', async () => {
      const { commitmentTree } = await fixtureFilled();
      const tree = getNewTree();
      tree.bulkInsert([123]);
      const root = toFixedHex(tree.root);
      await commitmentTree.insert(toFixedHex(234));
      expect(await commitmentTree.isKnownRoot(root)).to.equal(true);
    });

    it('should fail on unknown root', async () => {
      const { commitmentTree } = await fixtureFilled();
      const tree = getNewTree();
      tree.bulkInsert([456, 654]);
      const root = toFixedHex(tree.root);
      expect(await commitmentTree.isKnownRoot(root)).to.equal(false);
    });

    it('should not return uninitialized roots', async () => {
      const { commitmentTree } = await fixtureFilled();
      expect(await commitmentTree.isKnownRoot(toFixedHex(0))).to.equal(false);
    });
  });
});
