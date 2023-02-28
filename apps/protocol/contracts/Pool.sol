// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IVerifier.sol";
import "./interfaces/IPool.sol";
import "./MerkleTrees.sol";
import "./base/Compliance.sol";
import {CreateProofArgs, CreateData, CheckpointProofArgs, RevokeProofArgs, ExtData} from "./helpers/DataTypes.sol";

contract Pool is
    IPool,
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    MerkleTrees,
    Compliance,
    ReentrancyGuardUpgradeable
{
    using SafeERC20 for IERC20;

    IVerifier public immutable createVerifier;
    IVerifier public immutable checkpointVerifier;
    IVerifier public immutable revokeVerifier;
    IERC20 public immutable token;

    mapping(bytes32 => bool) public streamNullifierHashes;
    mapping(bytes32 => bool) public checkpointNullifierHashes;

    constructor(
        IERC20 token_,
        address hasher_,
        address sanctionsList_,
        IVerifier createVerifier_,
        IVerifier checkpointVerifier_,
        IVerifier revokeVerifier_
    ) MerkleTrees(hasher_) Compliance(sanctionsList_) {
        token = token_;
        createVerifier = createVerifier_;
        checkpointVerifier = checkpointVerifier_;
        revokeVerifier = revokeVerifier_;
    }

    function initialize(uint32 numStreamLevels_, uint32 numCheckpointLevels_) external initializer {
        __MerkleTrees_init(numStreamLevels_, numCheckpointLevels_);
        __Ownable_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    function create(CreateProofArgs calldata args, CreateData calldata data) external {
        if (!verifyCreateProof(args)) {
            revert InvalidProof();
        }

        token.safeTransferFrom(msg.sender, address(this), args.publicAmount);
        uint32 leafIndex = _insertStream(args.commitment);

        emit StreamInserted(
            args.commitment,
            leafIndex,
            data.encryptedDataSender,
            data.encryptedDataReceiver
        );
    }

    function withdraw(CheckpointProofArgs calldata args, ExtData calldata extData) external {
        if (extData.recipient == address(0)) {
            revert ZeroRecipientAddress();
        }

        _transactCheckpoint(args, extData);

        token.safeTransfer(extData.recipient, extData.withdrawAmount);

        if (extData.fee > 0) {
            token.safeTransfer(extData.relayer, extData.fee);
        }
    }

    function isCheckpointNullifierUsed(bytes32 nullifierHash) public view returns (bool) {
        return checkpointNullifierHashes[nullifierHash];
    }

    function isStreamNullifierUsed(bytes32 nullifierHash) public view returns (bool) {
        return streamNullifierHashes[nullifierHash];
    }

    function getPublicAmount(uint256 withdrawAmount, uint256 fee) public pure returns (uint256) {
        return withdrawAmount + fee;
    }

    function verifyCreateProof(CreateProofArgs calldata args) public view returns (bool) {
        return
            createVerifier.verifyProof(
                args.proof.a,
                args.proof.b,
                args.proof.c,
                [args.publicAmount, uint256(args.commitment)]
            );
    }

    function verifyWithdrawProof(CheckpointProofArgs calldata args) public view returns (bool) {
        return
            checkpointVerifier.verifyProof(
                args.proof.a,
                args.proof.b,
                args.proof.c,
                [
                    args.currentTime,
                    args.publicAmount,
                    uint256(args.streamRoot),
                    uint256(args.checkpointRoot),
                    uint256(args.inCheckpointNullifier),
                    uint256(args.outCheckpointCommitment)
                ]
            );
    }

    function _transactCheckpoint(CheckpointProofArgs calldata args, ExtData calldata extData)
        internal
        nonReentrant
    {
        if (!hasKnownStreamRoot(args.streamRoot) || !hasKnownCheckpointRoot(args.checkpointRoot)) {
            revert UnknownMerkleRoot();
        }

        if (isCheckpointNullifierUsed(args.inCheckpointNullifier)) {
            revert InputNullifierAlreadyUsed(args.inCheckpointNullifier);
        }

        if (args.currentTime > block.timestamp) {
            revert EarlyWithdraw(args.currentTime, block.timestamp);
        }

        if (args.publicAmount != getPublicAmount(extData.withdrawAmount, extData.fee)) {
            revert InvalidPublicAmount(args.publicAmount);
        }

        if (!verifyWithdrawProof(args)) {
            revert InvalidProof();
        }

        checkpointNullifierHashes[args.inCheckpointNullifier] = true;
        uint32 leafIndex = _insertCheckpoint(args.outCheckpointCommitment);

        emit CheckpointInserted(args.outCheckpointCommitment, leafIndex, extData.encryptedData);
        emit NullifierUsed(args.inCheckpointNullifier);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}
