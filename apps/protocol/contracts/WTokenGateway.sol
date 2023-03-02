// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IWToken.sol";
import "./interfaces/IPool.sol";
import "./interfaces/IWTokenGateway.sol";

import {CreateProofArgs, CheckpointProofArgs, ExtData} from "./helpers/DataTypes.sol";

contract WTokenGateway is IWTokenGateway {
    IWToken public immutable wToken;

    constructor(address wToken_) {
        wToken = IWToken(wToken_);
    }

    function create(
        address pool,
        CreateProofArgs calldata args,
        CreateData calldata data
    ) external payable {
        if (msg.value != args.publicAmount) {
            revert InvalidValueSent(msg.value, args.publicAmount);
        }

        wToken.deposit{value: msg.value}();
        wToken.approve(pool, msg.value);
        IPool(pool).create(args, data);
    }

    function withdraw(
        address pool,
        address unwrappedTokenReceiver,
        CheckpointProofArgs calldata args,
        ExtData calldata extData
    ) external {
        if (extData.recipient != address(this)) {
            revert RecipientNotGateway(extData.recipient, address(this));
        }

        IPool(pool).withdraw(args, extData);
        uint256 withdrawAmount = extData.withdrawAmount;
        wToken.approve(address(wToken), withdrawAmount);
        wToken.withdraw(withdrawAmount);
        _safeTransferETH(unwrappedTokenReceiver, withdrawAmount);
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }

    receive() external payable {}
}
