pragma solidity ^0.8.0;

contract Ownable
{
    address internal immutable owner;
    constructor() {owner = msg.sender;}

    modifier restricted() {
         require(checkOwner(msg.sender), "Only owner allowed!");
        _;
    }
    function checkOwner(address addr) public view returns(bool) {
        return addr == owner;
    }

    function changeOwner(address new_owner) 
        public
        restricted 
    {
        owner = msg.sender;
    }
}