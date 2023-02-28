// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {CreateData, CreateProofArgs, CheckpointProofArgs, ExtData} from "../helpers/DataTypes.sol";

interface IPool {
    event StreamInserted(
        bytes32 commitment,
        uint256 leafIndex,
        bytes encryptedDataSender,
        bytes encryptedDataReceiver
    );

    event CheckpointInserted(bytes32 commitment, uint256 leafIndex, bytes encrytpedData);

    event NullifierUsed(bytes32 nullifier);

    error InvalidProof();
    error UnknownMerkleRoot();
    error InputNullifierAlreadyUsed(bytes32 usedNullifier);
    error InvalidExtDataHash(bytes32 extDataHash);
    error InvalidPublicAmount(uint256 publicAmount);
    error InvalidAmount(uint256 amount);
    error EarlyWithdraw(uint256 currentTime, uint256 blockTime);
    error ZeroRecipientAddress();
    error DepositAmountExceedsMaxLimit(uint256 amount, uint256 maxAmountAllowed);
    error FeeExceedsMaxLimit(uint256 fee, uint256 maxFeeAllowed);
    error ExtAmountExceedsMaxLimit(uint256 extAmount, uint256 maxExtAmountAllowed);

    function create(CreateProofArgs calldata args, CreateData calldata data) external;

    function withdraw(CheckpointProofArgs calldata args, ExtData calldata extData) external;
}
