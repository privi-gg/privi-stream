// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../interfaces/ISanctionsList.sol";

interface ICompliance is ISanctionsList {
    error SanctionedAddress(address addr);
}
