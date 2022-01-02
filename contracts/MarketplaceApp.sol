// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./MarketplaceEntities.sol";
import "./CategoryManager.sol";
import "./RoleManager.sol";
import "./TaskManager.sol";

import "./openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MarketplaceApp is Ownable
{
    CategoryManager internal categoryManager;
    RoleManager internal roleManager;
    TaskManager internal taskManager;
    ERC20 internal token;

    event MarketplaceConstructed(address currencyBank, address owner);
    constructor(address token_)
    {
        require(token_ != address(0), "Invalid token");
        token = ERC20(token_);

        categoryManager = new CategoryManager();
        roleManager = new RoleManager(address(categoryManager));
        taskManager = new TaskManager(address(categoryManager), address(roleManager), token);

        emit MarketplaceConstructed(token_, owner());
    }

    function addCategory(string memory name) public restricted returns(uint) 
    {
        return categoryManager.addCategory(name);
    }
 
    function getCategoryName(uint id) public view returns(string memory)
    {
        return categoryManager.getCategoryName(id);
    }

    function isValidCategoryId(uint id) public view returns(bool)
    {
        return categoryManager.isValidCategoryId(id);
    }

    function getCategoriesCount() public view returns(uint)
    {
        return categoryManager.getCategoriesCount();
    }

    function stringifiedRole(RoleManager.Role _role) 
        public
        view
        returns (string memory)
    {
        return roleManager.stringifiedRole(_role);
    }

    function joinAsFreelancer(RoleManager.FreelancerData calldata _data) 
        public
    {
        return roleManager.joinAsFreelancer(msg.sender, _data);
    }

    function joinAsManager(RoleManager.ManagerData calldata _data) 
        public
    {
        return roleManager.joinAsManager(msg.sender, _data);
    }
     
    function joinAsSponsor(RoleManager.SponsorData calldata _data) 
        public
    {
        return roleManager.joinAsSponsor(msg.sender, _data);
    }

    function joinAsEvaluator(RoleManager.EvaluatorData calldata _data) 
        public
    {
        return roleManager.joinAsEvaluator(msg.sender, _data);
    }

    function getRole(address _address) 
        public 
        view 
        returns(RoleManager.Role)
    {
        return roleManager.getRole(_address);
    }

    function getMembersCount()
        public
        view
        returns(uint)
    {
        return roleManager.getMembersCount();
    }

   

    // function applyForTask(uint taskId)
    //     public
    //     restrictedTo(RoleManager.Role.Freelancer)
    //     canApply(msg.sender, taskId)
    // {
    //     // todo: this
    // }

    // function hireFreelancer(uint taskId, address freelancer)
    //     public
    //     restrictedTo(RoleManager.Role.Manager)
    //     taskInState(taskId, MarketplaceEntities.TaskState.Ready)
    //     restrictedToTaskManager(taskId)
    // {
    //     // transition from ready to working on it
    // }

    // function finishTask(uint taskId)
    //     public
    //     restrictedTo(RoleManager.Role.Freelancer)
    // {
    //     // transition from working on it to finished
    // }

    // function checkTask(uint taskId)
    //     public
    // {
    //     // transition from finished to accepted or WaitingForEvaluation
    // }
}