// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Registrar {
    event ShieldedAddress(address indexed owner, bytes shieldedAddress);

    function register(bytes calldata shieldedAddress) public {
        emit ShieldedAddress(msg.sender, shieldedAddress);
    }
}
