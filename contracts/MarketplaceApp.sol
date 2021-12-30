// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./Ownable.sol";
import "./MarketplaceEntities.sol";
import "./CategoryManager.sol";
import "./RolesManager.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MarketplaceApp is Ownable, CategoryManager, RolesManager
{
    ERC20 internal token;
    
    uint internal tasksCount;
    
    mapping(uint => MarketplaceEntities.TaskDataExtended) internal tasks;

    event MarketplaceConstructed(address currencyBank, address owner);
    event TaskAdded(address owner, string description, uint id);
    event TaskRemoved(address owner, uint id);
    event TaskSponsored(); // todo: update and call
    event TaskFunded(); // todo: update and call

    uint constant TASK_NO_FREELANCERS_TIMEOUT_MS = 10000;
    uint constant TASK_NO_EVALUATOR_TIMEOUT_MS = 10000;

    modifier restrictedTo(RolesManager.Role role)
    {
        require(getRole(msg.sender) == role, "operation restricted for that role");
        _;
    }

    modifier taskInState(uint taskId, MarketplaceEntities.TaskState state)
    {
        require(taskId < tasksCount, "invalid");
        require(tasks[taskId].state == state, "invalid");
        _;
    }

    modifier restrictedToTaskManager(uint taskId)
    {
        require(tasks[taskId].manager == msg.sender, "invalid");
        _;
    }

    modifier canApply(address freelancer, uint taskId)
    {
        // todo: this (check same category and task is ready)

        _;
    }

    constructor(address token_)
    {
        require(token_ != address(0), "Invalid token");
        token = ERC20(token_);
        
        emit MarketplaceConstructed(token_, owner());
    }

    function refundSponsors(uint taskId) 
        internal
    {
        // todo: iterate sponsors and return money
        // utils function 
        // must be internal
    }

    function addTask(MarketplaceEntities.TaskData calldata task)
        public
        restrictedTo(RolesManager.Role.Manager)
        returns (uint)
    {
        require(bytes(task.description).length > 0, "invalid description");
        require(task.rewardFreelancer > 0, "invalid");
        require(task.rewardEvaluator > 0, "invalid");
        require(isValidCategoryId(task.category), "invalid");
        
        uint taskId = tasksCount;
        MarketplaceEntities.TaskDataExtended storage taskEx = tasks[taskId];
        
        taskEx.data = task;
        taskEx.manager = msg.sender;
        taskEx.state = MarketplaceEntities.TaskState.NotFounded;
        taskEx.readyTimestamp = 0;

        tasksCount += 1;

        emit TaskAdded(msg.sender, task.description, taskId);

        return taskId;
    }

    function removeTask(uint taskId)
        public 
        restrictedTo(RolesManager.Role.Manager)
        restrictedToTaskManager(taskId)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        refundSponsors(taskId);
        delete tasks[taskId];

        emit TaskRemoved(msg.sender, taskId);
    }

    function sponsorTask(uint taskId, uint amount)
        public
        restrictedTo(RolesManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        uint amountAllowed = token.allowance(msg.sender, address(this));
        require(amount > 0, "invalid sponsorship value");
        require(amount <= amountAllowed, "invalid");
    
        MarketplaceEntities.SponsorshipInfo memory sponsorship;
        sponsorship.sponsor = msg.sender;
        sponsorship.amount = amount;
        
        MarketplaceEntities.TaskDataExtended memory task = tasks[taskId];

        uint existingAmount = 0; 
        uint targetAmount = task.data.rewardFreelancer + task.data.rewardEvaluator;
        
        // check for multiple sponsorhips from the same sponsor
        // todo: maybe update old sponsorship value ?

        for (uint i=0; i<task.sponsors.length; i++)
        {
            require(task.sponsors[i].sponsor != sponsorship.sponsor, "invalid");
            existingAmount += task.sponsors[i].amount;
        }
    
        // do not receive more than target amount
        require(sponsorship.amount <= targetAmount - existingAmount, "invalid");
        
        token.transferFrom(sponsorship.sponsor, address(this), sponsorship.amount);
        tasks[taskId].sponsors.push(sponsorship);

        existingAmount += sponsorship.amount;

        emit TaskSponsored();

        if(existingAmount == sponsorship.amount)
        {
            task.state = MarketplaceEntities.TaskState.Funded;
            emit TaskFunded();
        }
    }

    function withdrawSponsorship(uint taskId)
        public
        restrictedTo(RolesManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
         uint sponsorIdx = 0;
        
         MarketplaceEntities.TaskDataExtended memory task = tasks[taskId];

         for(uint i=0; i<task.sponsors.length; i++)
         {
             if(task.sponsors[i].sponsor == msg.sender)
            {
                token.transfer(task.sponsors[i].sponsor, task.sponsors[i].amount);
                
                // move all elements to cover the gap
                for(uint shIdx = i; shIdx < task.sponsors.length - 1; shIdx++)
                {
                    task.sponsors[shIdx] = task.sponsors[shIdx + 1];
                }
                tasks[taskId].sponsors.pop();
            }
         }
    }

    function linkEvaluatorToTask(uint taskId, address evaluator)
        public
        restrictedTo(RolesManager.Role.Manager)
        taskInState(taskId, MarketplaceEntities.TaskState.Funded)
        restrictedToTaskManager(taskId)
    {
        assert(tasks[taskId].evaluator == address(0));
        
        require(getRole(evaluator) == Role.Evaluator, "invalid");
        
        EvaluatorData memory info = getEvaluatorInfo(evaluator);

        require(info.categoryId ==  tasks[taskId].data.category, "invalid");

        tasks[taskId].evaluator = evaluator;
    }

    function applyForTask(uint taskId)
        public
        restrictedTo(RolesManager.Role.Freelancer)
        canApply(msg.sender, taskId)
    {
        // todo: this
    }

    function hireFreelancer(uint taskId, address freelancer)
        public
        restrictedTo(RolesManager.Role.Manager)
        taskInState(taskId, MarketplaceEntities.TaskState.Ready)
        restrictedToTaskManager(taskId)
    {
        // transition from ready to working on it
    }

    function finishTask(uint taskId)
        public
        restrictedTo(RolesManager.Role.Freelancer)
    {
        // transition from working on it to finished
    }

    function checkTask(uint taskId)
        public
    {
        // transition from finished to accepted or WaitingForEvaluation
    }
}