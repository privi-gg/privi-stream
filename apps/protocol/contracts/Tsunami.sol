// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IVerifier.sol";
import "./interfaces/IWETH.sol";
import "./MerkleTree.sol";

import "hardhat/console.sol";

contract Tsunami is MerkleTree, ReentrancyGuard {
    uint256 public constant MAX_EXT_AMOUNT = 2**248;
    uint256 public constant MAX_FEE = 2**248;
    uint256 public constant MIN_EXT_AMOUNT_LIMIT = 0.5 ether;

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

    struct ProposalProofArgs {
        Proof proof;
        uint256 amount;
        bytes32 commitment;
    }

    event NewCommitment(bytes32 commitment, uint256 index, bytes encryptedOutput);
    event NewNullifier(bytes32 nullifier);

    IVerifier public immutable proposalVerifier;
    IVerifier public immutable withdrawVerifier;
    IVerifier public immutable revokeVerifier;
    IWETH public immutable token;

    uint256 public maxDepositAmount;
    mapping(bytes32 => bool) public nullifierHashes;

    constructor(
        uint32 numLevels_,
        uint256 maxDepositAmount_,
        address hasher_,
        IWETH token_,
        IVerifier proposalVerifier_,
        IVerifier withdrawVerifier_,
        IVerifier revokeVerifier_
    ) MerkleTree(numLevels_, hasher_) {
        proposalVerifier = proposalVerifier_;
        withdrawVerifier = withdrawVerifier_;
        revokeVerifier = revokeVerifier_;
        token = token_;
        maxDepositAmount = maxDepositAmount_;
    }

    function create(ProposalProofArgs calldata args, bytes calldata encryptedOutput)
        external
        payable
    {
        require(msg.value == args.amount, "Invalid amount");
        require(verifyProposalProof(args), "Invalid proposal proof");
        token.deposit{value: args.amount}();
        uint32 index = _insert(args.commitment);
        emit NewCommitment(args.commitment, index, encryptedOutput);
    }

    function withdraw(WithdrawProofArgs calldata args, ExtData calldata extData) external {
        _transactWithdraw(args, extData);
    }

    function revoke(RevokeProofArgs calldata args, ExtData calldata extData) external {
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

    function verifyProposalProof(ProposalProofArgs calldata args) public view returns (bool) {
        return
            proposalVerifier.verifyProof(
                args.proof.a,
                args.proof.b,
                args.proof.c,
                [args.amount, uint256(args.commitment)]
            );
    }

    function verifyWithdrawProof(WithdrawProofArgs calldata args) public view returns (bool) {
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

    function verifyRevokeProof(RevokeProofArgs calldata args) public view returns (bool) {
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

    function _transactWithdraw(WithdrawProofArgs calldata args, ExtData calldata extData)
        internal
        nonReentrant
    {
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

        token.withdraw(extData.withdrawAmount);
        (bool success, ) = payable(extData.recipient).call{value: uint256(extData.withdrawAmount)}(
            ""
        );
        require(success, "Failed to send funds");
        // token.transfer(extData.recipient, uint256(extData.withdrawAmount));

        if (extData.fee > 0) {
            token.transfer(extData.relayer, extData.fee);
        }

        uint32 index = _insert(args.outputCommitment);

        emit NewCommitment(args.outputCommitment, index, extData.encryptedOutput);
        emit NewNullifier(args.inputNullifier);
    }

    function _transactRevoke(RevokeProofArgs calldata args, ExtData calldata extData)
        internal
        nonReentrant
    {
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
        token.withdraw(extData.withdrawAmount);
        (bool success, ) = payable(extData.recipient).call{value: uint256(extData.withdrawAmount)}(
            ""
        );
        require(success, "Failed to send funds");
        // token.transfer(extData.recipient, uint256(extData.withdrawAmount));

        if (extData.fee > 0) {
            token.transfer(extData.relayer, extData.fee);
        }

        uint32 index = _insert(args.outputCommitment);

        emit NewCommitment(args.outputCommitment, index, extData.encryptedOutput);
        emit NewNullifier(args.inputNullifier);
    }

    receive() external payable {}
}
