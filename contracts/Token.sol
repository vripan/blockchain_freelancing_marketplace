pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    address _bank;
    uint public constant totalSupply = 10000000;
    constructor(address bank_) 
        ERC20("Token", "TKN")
    {
        require(bank != address(0), "Invalid bank address");
        _bank = bank_;
        _mint(bank, totalSupply);
    }
}