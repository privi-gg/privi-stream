// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IVerifier {
    // Proposal
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[2] memory inputs
    ) external view returns (bool r);

    // Withdraw
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[6] memory inputs
    ) external view returns (bool r);
}
