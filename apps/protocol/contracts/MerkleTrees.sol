// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./base/MerkleTreesBase.sol";
import {TreeData} from "./helpers/DataTypes.sol";

contract MerkleTrees is MerkleTreesBase, Initializable {
    TreeData internal streamTree;
    TreeData internal checkpointTree;

    constructor(address hasher_) MerkleTreesBase(hasher_) {}

    function __MerkleTrees_init(uint256 numStreamLevels_, uint256 numCheckpointLevels_)
        internal
        onlyInitializing
    {
        if (numStreamLevels_ == 0 || numStreamLevels_ >= 32) {
            revert OutOfRangeMerkleTreeDepth(numStreamLevels_);
        }
        if (numCheckpointLevels_ == 0 || numCheckpointLevels_ >= 32) {
            revert OutOfRangeMerkleTreeDepth(numCheckpointLevels_);
        }

        _initTree(streamTree, numStreamLevels_, ZERO_LEAF_STREAM);
        _initTree(checkpointTree, numCheckpointLevels_, ZERO_LEAF_CHECKPOINT);
    }

    function hasKnownStreamRoot(bytes32 root) public view returns (bool) {
        return _hasKnownRoot(streamTree, root);
    }

    function hasKnownCheckpointRoot(bytes32 root) public view returns (bool) {
        return _hasKnownRoot(checkpointTree, root);
    }

    function getLastStreamRoot() public view returns (bytes32) {
        return streamTree.roots[streamTree.currentRootIndex];
    }

    function getLastCheckpointRoot() public view returns (bytes32) {
        return checkpointTree.roots[checkpointTree.currentRootIndex];
    }

    function hashLeaves(bytes32 left, bytes32 right) public view returns (bytes32) {
        return _hashLeaves(left, right);
    }

    function _insertStream(bytes32 leaf) internal returns (uint32) {
        return _insert(streamTree, leaf);
    }

    function _insertCheckpoint(bytes32 leaf) internal returns (uint32) {
        return _insert(checkpointTree, leaf);
    }

    uint256[50] __MerkleTrees_gap;
}
