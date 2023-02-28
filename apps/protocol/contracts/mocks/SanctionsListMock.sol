// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../interfaces/ISanctionsList.sol";

contract SanctionsListMock is ISanctionsList {
    mapping(address => bool) public sanctions;

    function isSanctioned(address addr) external view override returns (bool) {
        return sanctions[addr];
    }

    function setSanctioned(address addr, bool sanctioned) external {
        sanctions[addr] = sanctioned;
    }
}
