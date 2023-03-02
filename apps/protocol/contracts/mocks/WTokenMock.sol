// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WTokenMock is ERC20 {
    constructor() ERC20("WrappedToken", "WTKN") {}

    function deposit() external payable {
        _mint(msg.sender, msg.value);
    }

    function withdraw(uint256 value) external {
        _burn(msg.sender, value);
        (bool success, ) = msg.sender.call{value: value}("");
        require(success, "WToken: Token transfer failed");
    }
}
