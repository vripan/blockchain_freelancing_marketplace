// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./MarketplaceEntities.sol";
import "./CategoryManager.sol";
import "./RoleManager.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TaskManager
{
    CategoryManager categoryManager;
    RoleManager roleManager;
    ERC20 internal token;

    uint internal tasksCount;
    uint internal nextTaskId;
    
    mapping(uint => MarketplaceEntities.TaskDataExtended) internal tasks;

    uint constant TASK_NO_FREELANCERS_TIMEOUT_SECONDS = 10;
    uint constant TASK_NO_EVALUATOR_TIMEOUT_SECONDS = 10;

    modifier restrictedTo(address sender, RoleManager.Role role)
    {
        require(roleManager.getRole(sender) == role, "operation restricted for that role");
        _;
    }

    modifier taskInState(uint taskId, MarketplaceEntities.TaskState state)
    {
        // if task id is invalid (`taskId < nextTaskId`) then 
        // the state will be `TaskState.Unknown`

        require(tasks[taskId].state == state, "invalid");
        _;
    }

    modifier restrictedToTaskManager(address sender, uint taskId)
    {
        require(tasks[taskId].manager == sender, "invalid");
        _;
    }

    constructor(address categoryManager_, address roleManager_, address token_)
    {
        categoryManager = CategoryManager(categoryManager_);
        roleManager = RoleManager(roleManager_);
        token = ERC20(token_);

        tasksCount = 0;
        nextTaskId = 0;
    }

    function refundSponsors(uint taskId)
        internal
    {
        while(tasks[taskId].sponsors.length != 0)
        {
            uint idx = tasks[taskId].sponsors.length - 1;
            token.transfer(tasks[taskId].sponsors[idx].sponsor, tasks[taskId].sponsors[idx].amount);
            tasks[taskId].sponsors.pop();
        }
    }

    function addTask(address sender, MarketplaceEntities.TaskData calldata task)
        public
        restrictedTo(sender, RoleManager.Role.Manager)
        returns (uint)
    {
        require(bytes(task.description).length > 0, "E01");
        require(task.rewardFreelancer > 0, "E02");
        require(task.rewardEvaluator > 0, "E03");
        require(categoryManager.isValidCategoryId(task.category), "E04");
        
        uint taskId = nextTaskId;
        MarketplaceEntities.TaskDataExtended storage taskEx = tasks[taskId];
        
        taskEx.data = task;
        taskEx.manager = sender;
        taskEx.state = MarketplaceEntities.TaskState.NotFounded;
        taskEx.readyTimestamp = 0;

        nextTaskId += 1;
        tasksCount += 1;

        emit MarketplaceEntities.TaskAdded(sender, task.description, taskId);

        return taskId;
    }

    function removeTask(address sender, uint taskId)
        public 
        restrictedToTaskManager(sender, taskId)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        refundSponsors(taskId);
        delete tasks[taskId];
        tasksCount -= 1;

        emit MarketplaceEntities.TaskRemoved(sender, taskId);
    }

    function sponsorTask(address sender, uint taskId, uint amount)
        public
        restrictedTo(sender, RoleManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        uint amountAllowed = token.allowance(sender, address(this));
        uint senderBalance = token.balanceOf(sender);
        require(amount > 0, "E05");
        require(amountAllowed <= senderBalance, "E06");
        require(amount <= amountAllowed, "E07");
    
        MarketplaceEntities.SponsorshipInfo memory sponsorship;
        sponsorship.sponsor = sender;
        sponsorship.amount = amount;
        
        MarketplaceEntities.TaskDataExtended memory task = tasks[taskId];

        uint existingAmount = 0; 
        uint targetAmount = task.data.rewardFreelancer + task.data.rewardEvaluator;
        
        // check for multiple sponsorhips from the same sponsor
        for (uint i=0; i<task.sponsors.length; i++)
        {
            require(task.sponsors[i].sponsor != sponsorship.sponsor, "E08");
            existingAmount += task.sponsors[i].amount;
        }
    
        // do not receive more than target amount
        require(sponsorship.amount <= targetAmount - existingAmount, "E09");
        
        token.transferFrom(sponsorship.sponsor, address(this), sponsorship.amount);
        tasks[taskId].sponsors.push(sponsorship);

        existingAmount += sponsorship.amount;

        emit MarketplaceEntities.TaskSponsored(taskId, sender, amount);

        if(existingAmount == targetAmount)
        {
            tasks[taskId].state = MarketplaceEntities.TaskState.Funded;
            emit MarketplaceEntities.TaskFunded(taskId);
        }
    }

    function withdrawSponsorship(address sender, uint taskId)
        public
        restrictedTo(sender, RoleManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
         MarketplaceEntities.TaskDataExtended memory task = tasks[taskId];

         for(uint i=0; i<task.sponsors.length; i++)
         {
            if(task.sponsors[i].sponsor == sender)
            {
                token.transfer(task.sponsors[i].sponsor, task.sponsors[i].amount);
                
                MarketplaceEntities.deleteFromArray(tasks[taskId].sponsors, i);
                // move all elements to cover the gap
                // for(uint shIdx = i; shIdx < task.sponsors.length - 1; shIdx++)
                // {
                //     task.sponsors[shIdx] = task.sponsors[shIdx + 1];
                // }
                // tasks[taskId].sponsors.pop();

                emit MarketplaceEntities.SponsorshipWidrawed(taskId, task.sponsors[i].sponsor, task.sponsors[i].amount);
                return;
            }
         }
         revert();
    }

    function linkEvaluatorToTask(address sender, uint taskId, address evaluator)
        public
        restrictedToTaskManager(sender, taskId)
        taskInState(taskId, MarketplaceEntities.TaskState.Funded)
    {
        assert(tasks[taskId].evaluator == address(0));
        
        require(roleManager.getRole(evaluator) == RoleManager.Role.Evaluator, "E10");
        require(roleManager.getEvaluatorInfo(evaluator).data.categoryId ==  tasks[taskId].data.category, "E11");

        tasks[taskId].evaluator = evaluator;
        tasks[taskId].state = MarketplaceEntities.TaskState.Ready;
        tasks[taskId].readyTimestamp = block.timestamp + TASK_NO_FREELANCERS_TIMEOUT_SECONDS;

        emit MarketplaceEntities.TaskReady(taskId, evaluator);
    }

    function checkHireTimeout(uint taskId)
        public
        taskInState(taskId, MarketplaceEntities.TaskState.Ready)
    {
        require(tasks[taskId].readyTimestamp >= block.timestamp, "E12");
        require(tasks[taskId].freelancers.length == 0, "E13");

        refundSponsors(taskId);
        tasks[taskId].state = MarketplaceEntities.TaskState.TimeoutOnHiring;
    
        emit MarketplaceEntities.TaskHiringTimeout(taskId);
    }

    function getTasksCount() 
        public 
        view
        returns(uint)
    {
        return tasksCount;
    }
}