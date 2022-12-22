// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

library DataTypes {
    struct ExtData {
        address recipient;
        uint256 withdrawAmount;
        address relayer;
        uint256 fee;
        bytes encryptedOutput;
    }

    struct Proof {
        uint256[2] a;
        uint256[2][2] b;
        uint256[2] c;
    }

    struct WithdrawProofArgs {
        Proof proof;
        bytes32 root;
        bytes32 inputNullifier;
        bytes32 outputCommitment;
        bytes32 extDataHash;
        uint256 publicAmount;
        uint256 checkpointTime;
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

    struct CreateProofArgs {
        Proof proof;
        bytes32 commitment;
        uint256 publicAmount;
    }
}
