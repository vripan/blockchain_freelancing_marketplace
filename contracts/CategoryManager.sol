// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

contract CategoryManager
{
    uint internal nextId;
    mapping(uint => string) internal categories;

    event CategoryAdded(uint id, string name);

    constructor() 
    {
        nextId = 0;
    }

    function addCategory(string memory name)
        public
        returns (uint)
    {
        bytes memory nameBytes = bytes(name);
        require(nameBytes.length > 0, "invalid category name");
        
        uint id = nextId;
        categories[id] = name;
        nextId += 1;
        
        emit CategoryAdded(id, name);
        
        return id;
    }

    function getCategoryName(uint id) 
        public
        view
        returns(string memory)
    {
        require(isValidCategoryId(id), "invalid id");
        return categories[id];
    }

    function isValidCategoryId(uint id)
        public
        view
        returns(bool)
    {
        return id < nextId;
    }

    function getCategoriesCount()
        public
        view
        returns(uint)
    {
        return nextId;
    }
}