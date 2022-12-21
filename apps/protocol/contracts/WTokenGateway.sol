// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IWToken.sol";
import "./interfaces/ITsunami.sol";

contract WTokenGateway {
    IWToken public immutable wToken;

    constructor(address wToken_) {
        wToken = IWToken(wToken_);
    }

    function create(
        address tsunami,
        DataTypes.ProposalProofArgs calldata args,
        bytes calldata encryptedOutput
    ) external payable {
        wToken.deposit{value: msg.value}();
        ITsunami(tsunami).create(args, encryptedOutput);
    }

    function withdraw(
        address tsunami,
        address unwrappedTokenReceiver,
        DataTypes.WithdrawProofArgs calldata args,
        DataTypes.ExtData calldata extData
    ) external {
        require(extData.recipient == address(this), "Require recipient to be gateway");
        ITsunami(tsunami).withdraw(args, extData);
        uint256 withdrawAmount = uint256(extData.withdrawAmount);
        wToken.withdraw(withdrawAmount);
        _safeTransferETH(unwrappedTokenReceiver, withdrawAmount);
    }

    function revoke(
        address tsunami,
        address unwrappedTokenReceiver,
        DataTypes.RevokeProofArgs calldata args,
        DataTypes.ExtData calldata extData
    ) external {
        require(extData.recipient == address(this), "Require recipient to be gateway");
        ITsunami(tsunami).revoke(args, extData);
        uint256 withdrawAmount = uint256(extData.withdrawAmount);
        wToken.withdraw(withdrawAmount);
        _safeTransferETH(unwrappedTokenReceiver, withdrawAmount);
    }

    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "ETH_TRANSFER_FAILED");
    }
}
