// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../MerkleTrees.sol";

contract MerkleTreesMock is Initializable, MerkleTrees {
    constructor(address hasher_) MerkleTrees(hasher_) {}

    function initialize(uint32 numStreamLevels_, uint32 numCheckpointLevels_) external initializer {
        __MerkleTrees_init(numStreamLevels_, numCheckpointLevels_);
    }

    function insertStream(bytes32 leaf) public returns (uint32) {
        return _insertStream(leaf);
    }

    function insertCheckpoint(bytes32 leaf) public returns (uint32) {
        return _insertCheckpoint(leaf);
    }

    function getStreamSubtreeNode(uint256 index) public view returns (bytes32) {
        return streamTree.lastSubtrees[index];
    }

    function getCheckpointSubtreeNode(uint256 index) public view returns (bytes32) {
        return checkpointTree.lastSubtrees[index];
    }

    function getStreamZeroNode(uint256 index) public view returns (bytes32) {
        return streamTree.zeroes[index];
    }

    function getCheckpointZeroNode(uint256 index) public view returns (bytes32) {
        return checkpointTree.zeroes[index];
    }
}
