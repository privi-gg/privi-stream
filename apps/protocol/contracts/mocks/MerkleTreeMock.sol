// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../MerkleTree.sol";

contract MerkleTreeMock is MerkleTree {
    constructor(uint32 levels, address hasher) MerkleTree(levels, hasher) {}

    function insert(bytes32 leaf) public returns (uint32 index) {
        return _insert(leaf);
    }
}
