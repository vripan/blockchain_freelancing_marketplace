// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract Ownable
{
    address internal _owner;
    constructor() 
    {
        _owner = msg.sender;
    }

    modifier restricted() 
    {
         require(checkOwner(msg.sender), "Only owner allowed!");
        _;
    }
    function checkOwner(address addr) 
        public
        view
        returns(bool) 
    {
        return addr == _owner;
    }

    function owner() 
        public
        view
        returns(address) 
    {
        return _owner;
    }

    function changeOwner(address new_owner) 
        public
        restricted 
    {
        _owner = new_owner;
    }
}