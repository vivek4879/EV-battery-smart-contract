pragma solidity ^0.8.9;

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.3.2 (utils/Context.sol)

import "./tokenOpenZepplin.sol";

contract MyToken is ERC20 {
    constructor() ERC20("EVBToken", "MKR"){
        _mint(0x257e1d71B026E512721F6eFB9E963d383e05BbcE, 1000000000 * (10 ** uint256(decimals())));
    }

    function approveCustom(address spender, uint256 amount) public virtual returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

}
