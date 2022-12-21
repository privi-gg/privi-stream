// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IVerifier.sol";
import "./interfaces/ITsunami.sol";
import "./MerkleTree.sol";
import {DataTypes} from "./types/DataTypes.sol";

contract Tsunami is ITsunami, MerkleTree, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_EXT_AMOUNT = 2**248;
    uint256 public constant MAX_FEE = 2**248;
    uint256 public constant MIN_EXT_AMOUNT_LIMIT = 0.5 ether;

    IVerifier public immutable createVerifier;
    IVerifier public immutable withdrawVerifier;
    IVerifier public immutable revokeVerifier;
    IERC20 public immutable token;

    uint256 public maxDepositAmount;
    mapping(bytes32 => bool) public nullifierHashes;

    constructor(
        uint32 numLevels_,
        uint256 maxDepositAmount_,
        IERC20 token_,
        address hasher_,
        IVerifier createVerifier_,
        IVerifier withdrawVerifier_,
        IVerifier revokeVerifier_
    ) MerkleTree(numLevels_, hasher_) {
        createVerifier = createVerifier_;
        withdrawVerifier = withdrawVerifier_;
        revokeVerifier = revokeVerifier_;
        token = token_;
        maxDepositAmount = maxDepositAmount_;
    }

    function create(DataTypes.ProposalProofArgs calldata args, bytes calldata encryptedOutput)
        external
    {
        require(verifyCreateProof(args), "Invalid create proof");
        token.safeTransferFrom(msg.sender, address(this), args.amount);
        uint32 index = _insert(args.commitment);
        emit NewCommitment(args.commitment, index, encryptedOutput);
    }

    function withdraw(DataTypes.WithdrawProofArgs calldata args, DataTypes.ExtData calldata extData)
        external
    {
        _transactWithdraw(args, extData);
    }

    function revoke(DataTypes.RevokeProofArgs calldata args, DataTypes.ExtData calldata extData)
        external
    {
        _transactRevoke(args, extData);
    }

    function isSpent(bytes32 nullifierHash) public view returns (bool) {
        return nullifierHashes[nullifierHash];
    }

    function calculatePublicAmount(uint256 withdrawAmount, uint256 fee)
        public
        pure
        returns (uint256)
    {
        require(fee < MAX_FEE, "Invalid fee");
        require(withdrawAmount < MAX_EXT_AMOUNT, "Invalid ext amount");
        return withdrawAmount + fee;
    }

    function verifyCreateProof(DataTypes.ProposalProofArgs calldata args)
        public
        view
        returns (bool)
    {
        return
            createVerifier.verifyProof(
                args.proof.a,
                args.proof.b,
                args.proof.c,
                [args.amount, uint256(args.commitment)]
            );
    }

    function verifyWithdrawProof(DataTypes.WithdrawProofArgs calldata args)
        public
        view
        returns (bool)
    {
        return
            withdrawVerifier.verifyProof(
                args.proof.a,
                args.proof.b,
                args.proof.c,
                [
                    uint256(args.root),
                    args.publicAmount,
                    uint256(args.extDataHash),
                    uint256(args.inputNullifier),
                    args.checkpointTime,
                    uint256(args.outputCommitment)
                ]
            );
    }

    function verifyRevokeProof(DataTypes.RevokeProofArgs calldata args) public view returns (bool) {
        return
            revokeVerifier.verifyProof(
                args.proof.a,
                args.proof.b,
                args.proof.c,
                [
                    uint256(args.root),
                    args.publicAmount,
                    uint256(args.extDataHash),
                    uint256(args.inputNullifier),
                    args.stopTime,
                    uint256(args.outputCommitment)
                ]
            );
    }

    function _transactWithdraw(
        DataTypes.WithdrawProofArgs calldata args,
        DataTypes.ExtData calldata extData
    ) internal nonReentrant {
        require(isKnownRoot(args.root), "Invalid merkle root");
        require(!isSpent(args.inputNullifier), "Input is already spent");
        require(args.checkpointTime <= block.timestamp, "Early withdraw");
        require(
            uint256(args.extDataHash) == uint256(keccak256(abi.encode(extData))) % FIELD_SIZE,
            "Incorrect external data hash"
        );
        require(
            args.publicAmount == calculatePublicAmount(extData.withdrawAmount, extData.fee),
            "Invalid public amount"
        );
        require(extData.recipient != address(0), "Cannot withdraw to zero address");
        require(verifyWithdrawProof(args), "Invalid transaction proof");

        nullifierHashes[args.inputNullifier] = true;

        token.safeTransfer(extData.recipient, uint256(extData.withdrawAmount));

        if (extData.fee > 0) {
            token.safeTransfer(extData.relayer, extData.fee);
        }

        uint32 index = _insert(args.outputCommitment);

        emit NewCommitment(args.outputCommitment, index, extData.encryptedOutput);
        emit NewNullifier(args.inputNullifier);
    }

    function _transactRevoke(
        DataTypes.RevokeProofArgs calldata args,
        DataTypes.ExtData calldata extData
    ) internal nonReentrant {
        require(isKnownRoot(args.root), "Invalid merkle root");
        require(!isSpent(args.inputNullifier), "Input is already spent");
        require(args.stopTime >= block.timestamp, "Early revoke");
        require(
            uint256(args.extDataHash) == uint256(keccak256(abi.encode(extData))) % FIELD_SIZE,
            "Incorrect external data hash"
        );
        require(
            args.publicAmount == calculatePublicAmount(extData.withdrawAmount, extData.fee),
            "Invalid public amount"
        );
        require(extData.recipient != address(0), "Cannot withdraw to zero address");
        require(verifyRevokeProof(args), "Invalid transaction proof");

        nullifierHashes[args.inputNullifier] = true;

        token.safeTransfer(extData.recipient, uint256(extData.withdrawAmount));

        if (extData.fee > 0) {
            token.safeTransfer(extData.relayer, extData.fee);
        }

        uint32 index = _insert(args.outputCommitment);

        emit NewCommitment(args.outputCommitment, index, extData.encryptedOutput);
        emit NewNullifier(args.inputNullifier);
    }
}
