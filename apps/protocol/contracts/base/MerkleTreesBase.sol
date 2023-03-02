// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../interfaces/IHasher.sol";
import "../interfaces/IMerkleTrees.sol";
import {TreeData} from "../helpers/DataTypes.sol";

abstract contract MerkleTreesBase is IMerkleTrees {
    uint256 public constant FIELD_SIZE =
        21888242871839275222246405745257275088548364400416034343698204186575808495617;

    uint32 public constant ROOT_HISTORY_SIZE = 100;

    uint256 public constant ZERO_LEAF_STREAM =
        uint256(keccak256("privi-stream:stream")) % FIELD_SIZE;
    uint256 public constant ZERO_LEAF_CHECKPOINT =
        uint256(keccak256("privi-stream:checkpoint")) % FIELD_SIZE;

    IHasher public immutable hasher;

    constructor(address hasher_) {
        hasher = IHasher(hasher_);
    }

    function _hashLeaves(bytes32 left, bytes32 right) public view returns (bytes32) {
        if (uint256(left) >= FIELD_SIZE) {
            revert InputOutOfFieldSize(left);
        }

        if (uint256(right) >= FIELD_SIZE) {
            revert InputOutOfFieldSize(right);
        }

        bytes32[2] memory input;
        input[0] = left;
        input[1] = right;

        return hasher.poseidon(input);
    }

    function _initTree(
        TreeData storage tree,
        uint256 numLevels,
        uint256 zeroLeaf
    ) internal {
        tree.numLevels = numLevels;
        bytes32 zero = bytes32(zeroLeaf);

        for (uint8 i = 0; i < numLevels; ) {
            tree.zeroes[i] = zero;
            tree.lastSubtrees[i] = zero;
            zero = _hashLeaves(zero, zero);
            unchecked {
                ++i;
            }
        }

        tree.roots[0] = zero;
    }

    function _insert(TreeData storage tree, bytes32 leaf) internal returns (uint32) {
        uint32 _nextIndex = tree.nextLeafIndex;
        if (_nextIndex >= 2**tree.numLevels) revert MerkleTreeFull();

        uint32 currentIndex = _nextIndex;
        bytes32 currentLevelHash = leaf;

        bytes32 left;
        bytes32 right;

        for (uint32 i = 0; i < tree.numLevels; ) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = tree.zeroes[i];
                tree.lastSubtrees[i] = currentLevelHash;
            } else {
                left = tree.lastSubtrees[i];
                right = currentLevelHash;
            }

            currentLevelHash = _hashLeaves(left, right);

            currentIndex /= 2;

            unchecked {
                ++i;
            }
        }

        uint32 newRootIndex = (tree.currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        tree.currentRootIndex = newRootIndex;
        tree.roots[newRootIndex] = currentLevelHash;
        tree.nextLeafIndex = _nextIndex + 1;
        return _nextIndex;
    }

    function _hasKnownRoot(TreeData storage tree, bytes32 root) internal view returns (bool) {
        if (root == 0) {
            return false;
        }
        uint32 _currentRootIndex = tree.currentRootIndex;
        uint256 i = _currentRootIndex;
        do {
            if (root == tree.roots[i]) {
                return true;
            }
            if (i == 0) {
                i = ROOT_HISTORY_SIZE;
            }
            --i;
        } while (i != _currentRootIndex);
        return false;
    }
}
