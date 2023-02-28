// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../interfaces/ICompliance.sol";

abstract contract Compliance is ICompliance {
    ISanctionsList public immutable sanctionsList;

    modifier onlyNonSanctioned() {
        if (isSanctioned(msg.sender)) {
            revert SanctionedAddress(msg.sender);
        }
        _;
    }

    constructor(address sanctionsList_) {
        sanctionsList = ISanctionsList(sanctionsList_);
    }

    function isSanctioned(address addr) public view returns (bool) {
        return sanctionsList.isSanctioned(addr);
    }

    uint256[50] __Compliance_gap;
}
