// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./MarketplaceEntities.sol";
import "./CategoryManager.sol";
import "./RoleManager.sol";

import "./openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract TaskManager
{
    CategoryManager categoryManager;
    RoleManager roleManager;
    ERC20 internal token;

    uint internal tasksCount;
    uint internal nextTaskId;
    
    mapping(uint => MarketplaceEntities.TaskDataExtended) internal tasks;

    event TaskAdded(address owner, string description, uint id);
    event TaskRemoved(address owner, uint taskId);
    event SponsorshipWidrawed(uint taskId, address sponsor, uint amount);
    event TaskSponsored(uint taskId, address sponsor, uint amount);
    event TaskFunded(uint taskId);
    event TaskReady(uint taskId, address evaluator);
    event TaskHiringTimeout(uint taskId);

    uint constant TASK_NO_FREELANCERS_TIMEOUT_SECONDS = 10;
    uint constant TASK_NO_EVALUATOR_TIMEOUT_SECONDS = 10;

    modifier restrictedTo(RoleManager.Role role)
    {
        require(roleManager.getRole(msg.sender) == role, "operation restricted for that role");
        _;
    }

    modifier taskInState(uint taskId, MarketplaceEntities.TaskState state)
    {
        require(taskId < nextTaskId, "invalid task id");
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
   
    constructor(address categoryManager_, address roleManager_, address token_)
    {
        categoryManager = categoryManager_;
        roleManager = roleManager_;
        token = token_;

        tasksCount = 0;
        nextTaskId = 0;
    }

    function refundSponsors(uint taskId)
        internal
    {
        MarketplaceEntities.TaskDataExtended storage task = tasks[taskId];

        while(task.sponsors.length != 0)
        {
            uint idx = task.sponsors.length - 1;
            token.transfer(task.sponsors[idx].sponsor, task.sponsors[idx].amount);
            task.sponsors.pop();
        }
    }

    function addTask(MarketplaceEntities.TaskData calldata task)
        public
        restrictedTo(RoleManager.Role.Manager)
        returns (uint)
    {
        require(bytes(task.description).length > 0, "invalid description");
        require(task.rewardFreelancer > 0, "invalid");
        require(task.rewardEvaluator > 0, "invalid");
        require(categoryManager.isValidCategoryId(task.category), "invalid");
        
        uint taskId = nextTaskId;
        MarketplaceEntities.TaskDataExtended storage taskEx = tasks[taskId];
        
        taskEx.data = task;
        taskEx.manager = msg.sender;
        taskEx.state = MarketplaceEntities.TaskState.NotFounded;
        taskEx.readyTimestamp = 0;

        nextTaskId += 1;
        tasksCount += 1;

        emit TaskAdded(msg.sender, task.description, taskId);

        return taskId;
    }

    function removeTask(uint taskId)
        public 
        restrictedTo(RoleManager.Role.Manager)
        restrictedToTaskManager(taskId)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        refundSponsors(taskId);
        delete tasks[taskId];
        tasksCount -= 1;

        emit TaskRemoved(msg.sender, taskId);
    }

    function sponsorTask(uint taskId, uint amount)
        public
        restrictedTo(RoleManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        uint amountAllowed = token.allowance(msg.sender, address(this));
        uint senderBalance = token.balanceOf(msg.sender);
        require(amount > 0, "invalid zero sponsorship value");
        require(amountAllowed <= senderBalance, "insufficient balance");
        require(amount <= amountAllowed, "insufficient allowance");
    
        MarketplaceEntities.SponsorshipInfo memory sponsorship;
        sponsorship.sponsor = msg.sender;
        sponsorship.amount = amount;
        
        MarketplaceEntities.TaskDataExtended memory task = tasks[taskId];

        uint existingAmount = 0; 
        uint targetAmount = task.data.rewardFreelancer + task.data.rewardEvaluator;
        
        // check for multiple sponsorhips from the same sponsor
        for (uint i=0; i<task.sponsors.length; i++)
        {
            require(task.sponsors[i].sponsor != sponsorship.sponsor, "sponsor not unique");
            existingAmount += task.sponsors[i].amount;
        }
    
        // do not receive more than target amount
        require(sponsorship.amount <= targetAmount - existingAmount, "sponsorship amount too large");
        
        token.transferFrom(sponsorship.sponsor, address(this), sponsorship.amount);
        tasks[taskId].sponsors.push(sponsorship);

        existingAmount += sponsorship.amount;

        emit TaskSponsored(taskId, msg.sender, amount);

        if(existingAmount == targetAmount)
        {
            tasks[taskId].state = MarketplaceEntities.TaskState.Funded;
            emit TaskFunded(taskId);
        }
    }

    function withdrawSponsorship(uint taskId)
        public
        restrictedTo(RoleManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
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

                emit SponsorshipWidrawed(taskId, task.sponsors[i].sponsor, task.sponsors[i].amount);
                return;
            }
         }
         revert();
    }

    function linkEvaluatorToTask(uint taskId, address evaluator)
        public
        restrictedTo(RoleManager.Role.Manager)
        taskInState(taskId, MarketplaceEntities.TaskState.Funded)
        restrictedToTaskManager(taskId)
    {
        assert(tasks[taskId].evaluator == address(0));
        
        require(roleManager.getRole(evaluator) == RoleManager.Role.Evaluator, "mismatched role, expected evaluator");
        require(roleManager.getEvaluatorInfo(evaluator).data.categoryId ==  tasks[taskId].data.category, "mismatched evaluator category");

        tasks[taskId].evaluator = evaluator;
        tasks[taskId].state = MarketplaceEntities.TaskState.Ready;
        tasks[taskId].readyTimestamp = block.timestamp + TASK_NO_FREELANCERS_TIMEOUT_SECONDS;

        emit TaskReady(taskId, evaluator);
    }

    function checkHireTimeout(uint taskId)
        public
        taskInState(taskId, MarketplaceEntities.TaskState.Ready)
    {
        require(tasks[taskId].readyTimestamp >= block.timestamp, "no timeout");
        require(tasks[taskId].freelancers.length == 0, "freelancers joined");

        refundSponsors(taskId);
        tasks[taskId].state = MarketplaceEntities.TaskState.TimeoutOnHiring;
    
        emit TaskHiringTimeout(taskId);
    }

    function getTasksCount() 
        public 
        view
        returns(uint)
    {
        return tasksCount;
    }
}