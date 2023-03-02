// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {CreateProofArgs, CreateData, CheckpointProofArgs, ExtData} from "../helpers/DataTypes.sol";

interface IWTokenGateway {
    error ZeroRecipientAddress();
    error InvalidValueSent(uint256 sent, uint256 required);
    error RecipientNotGateway(address recipient, address gateway);

    function create(
        address pool,
        CreateProofArgs calldata args,
        CreateData calldata createData
    ) external payable;

    function withdraw(
        address pool,
        address unwrappedTokenReceiver,
        CheckpointProofArgs calldata args,
        ExtData calldata extData
    ) external;
}
