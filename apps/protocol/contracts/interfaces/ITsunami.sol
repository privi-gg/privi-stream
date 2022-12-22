// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import {DataTypes} from "../types/DataTypes.sol";

interface ITsunami {
    event NewCommitment(bytes32 commitment, uint256 leafIndex, bytes encryptedOutput);
    event NewNullifier(bytes32 nullifier);

    function create(DataTypes.CreateProofArgs calldata args, bytes calldata encryptedOutput)
        external;

    function withdraw(DataTypes.WithdrawProofArgs calldata args, DataTypes.ExtData calldata extData)
        external;

    function revoke(DataTypes.RevokeProofArgs calldata args, DataTypes.ExtData calldata extData)
        external;
}
