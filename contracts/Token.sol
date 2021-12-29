// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    uint8 internal constant _decimals = 2;
    uint internal constant _dripAmount = 1000;
    constructor() 
        ERC20("Token", "TKN")
    {
    }

    function decimals() 
        public 
        view 
        virtual 
        override 
        returns (uint8) 
    {
        return _decimals;
    }

    function openFaucet() 
        public
    {
        _mint(msg.sender, _dripAmount * (10 ** _decimals));
    }
}