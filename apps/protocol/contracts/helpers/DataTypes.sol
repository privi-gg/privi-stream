// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

struct ExtData {
    address recipient;
    uint256 withdrawAmount;
    address relayer;
    uint256 fee;
    bytes encryptedData;
}

struct Proof {
    uint256[2] a;
    uint256[2][2] b;
    uint256[2] c;
}

struct CheckpointProofArgs {
    Proof proof;
    uint256 currentTime;
    uint256 publicAmount;
    bytes32 streamRoot;
    bytes32 checkpointRoot;
    bytes32 inCheckpointNullifier;
    bytes32 outCheckpointCommitment;
}

struct RevokeProofArgs {
    Proof proof;
    bytes32 root;
    bytes32 inputNullifier;
    bytes32 outputCommitment;
    bytes32 extDataHash;
    uint256 publicAmount;
    uint256 stopTime;
}

struct CreateData {
    bytes encryptedDataSender;
    bytes encryptedDataReceiver;
}

struct CreateProofArgs {
    Proof proof;
    bytes32 commitment;
    uint256 publicAmount;
}

struct TreeData {
    uint256 numLevels;
    mapping(uint256 => bytes32) lastSubtrees;
    mapping(uint256 => bytes32) roots;
    mapping(uint256 => bytes32) zeroes;
    uint32 currentRootIndex;
    uint32 nextLeafIndex;
}
