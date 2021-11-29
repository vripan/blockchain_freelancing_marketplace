// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    address _bank;
    uint public constant _totalSupply = 10000000;
    uint8 public constant _decimals = 2;
    
    constructor(address bank_) 
        ERC20("Token", "TKN")
    {
        require(bank_ != address(0), "Invalid bank address");
        _bank = bank_;
        _mint(_bank, _totalSupply * (10 ** _decimals));
    }

    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
}