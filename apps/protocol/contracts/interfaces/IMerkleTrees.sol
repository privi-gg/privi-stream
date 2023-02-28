// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface IMerkleTrees {
    error OutOfRangeMerkleTreeDepth(uint256 depth);
    error InputOutOfFieldSize(bytes32 input);
    error MerkleTreeFull();

    function hashLeaves(bytes32 left, bytes32 right) external view returns (bytes32);

    function hasKnownStreamRoot(bytes32 root) external view returns (bool);

    function hasKnownCheckpointRoot(bytes32 root) external view returns (bool);

    function getLastStreamRoot() external view returns (bytes32);

    function getLastCheckpointRoot() external view returns (bytes32);
}
