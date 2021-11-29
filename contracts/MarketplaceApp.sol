// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./MarketplaceEntities.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MarketplaceApp is Ownable
{
    ERC20 internal token;
    
    uint internal categoriesCount;
    uint internal membersCount;
    uint internal tasksCount;
    
    mapping(uint => string) internal categories;
    mapping(uint => MarketplaceEntities.TaskData) internal tasks;
    mapping(address => MarketplaceEntities.FreelancerData) internal freelancers;
    mapping(address => MarketplaceEntities.ManagerData) internal maanger;
    mapping(address => MarketplaceEntities.SponsorData) internal sponsors;
    mapping(address => MarketplaceEntities.EvaluatorData) internal evaluators;

    event MarketplaceConstructed(address currencyBank);
    event MemberJoined(MarketplaceEntities.Role role, string name, address address_);
    event CategoryAdded(uint id, string name);
    event TaskAdded(address owner, string description, uint id);

    uint constant TASK_NO_FREELANCERS_TIMEOUT_MS = 10000;
    uint constant TASK_NO_EVALUATOR_TIMEOUT_MS = 10000;

    modifier restrictedTo(MarketplaceEntities.Role role)
    {
        // todo: this
        _;
    }

    modifier taskState(uint taskId, address manager, MarketplaceEntities.TaskState state)
    {
        // todo: this (check task manager to be `manager`)
        _;
    }

    modifier canApply(address freelancer, uint taskId)
    {
        // todo: this (check same category and task is ready)

        _;
    }

    modifier canEvaluate(address evaluator, uint taskId)
    {
        // todo: this (check same category)
        _;
    }

    modifier canSponsor(address sponsor, uint taskId)
    {
        // todo: check task state
        _;
    }

    constructor(address token_)
    {
        require(token_ != address(0), "Invalid token");
        token = ERC20(token_);
        
        // todo: other init

        emit MarketplaceConstructed(token_);
    }

    function joinAsFreelancer(MarketplaceEntities.FreelancerData calldata data) 
        public
    {
        // todo: register

        emit MemberJoined(MarketplaceEntities.Role.Freelancer, data.name, msg.sender);
    }

    function joinAsManager(MarketplaceEntities.ManagerData calldata data) 
        public
    {
        // todo: register

        emit MemberJoined(MarketplaceEntities.Role.Manager, data.name, msg.sender);
    }
     
     function joinAsSponsor(MarketplaceEntities.SponsorData calldata data) 
        public
    {
        // todo: register

        emit MemberJoined(MarketplaceEntities.Role.Sponsor, data.name, msg.sender);
    }

     function joinAsEvaluator(MarketplaceEntities.EvaluatorData calldata data) 
        public
    {
        // todo: register

        emit MemberJoined(MarketplaceEntities.Role.Evaluator, data.name, msg.sender);
    }

    function addCategory(string memory name)
        public
        restricted
        returns (uint)
    {
        // todo: index by incremental id
        emit CategoryAdded(0, name);
        return 0;
    }

    function addTask(MarketplaceEntities.TaskData calldata data)
        public
        restrictedTo(MarketplaceEntities.Role.Manager)
        returns (uint)
    {
        // todo: index by incremental id
        emit TaskAdded(msg.sender, data.description, 0);
        return 0;
    }

    function removeTask(uint id)
        public 
        restrictedTo(MarketplaceEntities.Role.Manager)
    {
    }

    function sponsorTask(uint taskId, uint amount)
        public
        restrictedTo(MarketplaceEntities.Role.Sponsor)
        canSponsor(msg.sender, taskId)
    {
        // transition from notFound to founded
    }

    function withdrawSponsorship(uint taskId, uint amount)
        public
        restrictedTo(MarketplaceEntities.Role.Sponsor)
    {
    }

    function linkEvaluatorToTask(uint taskId, address evaluator)
        public
        restrictedTo(MarketplaceEntities.Role.Manager)
        taskState(taskId, msg.sender, MarketplaceEntities.TaskState.Funded)
        canEvaluate(evaluator, taskId)
    {
        // transition from founded to ready
    }

    function applyForTask(uint taskId)
        public
        restrictedTo(MarketplaceEntities.Role.Freelancer)
        canApply(msg.sender, taskId)
    {

    }

    function hireFreelancer(uint taskId, address freelancer)
        public
        restrictedTo(MarketplaceEntities.Role.Manager)
        taskState(taskId, msg.sender, MarketplaceEntities.TaskState.Ready)
    {
        // transition from ready to working on it
    }

}