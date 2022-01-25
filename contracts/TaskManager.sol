// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "./MarketplaceEntities.sol";
import "./CategoryManager.sol";
import "./MemberManager.sol";

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TaskManager
{
    CategoryManager categoryManager;
    MemberManager memberManager;
    ERC20 internal token;

    uint internal tasksCount;
    uint internal nextTaskId;
    
    mapping(uint => MarketplaceEntities.TaskDataExtended) internal tasks;

    uint constant TASK_NO_FREELANCERS_TIMEOUT_SECONDS = 10;
    uint constant TASK_NO_EVALUATOR_TIMEOUT_SECONDS = 10;

    modifier restrictedTo(MemberManager.Role role)
    {
        require(memberManager.getRole(msg.sender) == role, "Operation restricted for that role");
        _;
    }

    modifier taskInState(uint taskId, MarketplaceEntities.TaskState state)
    {
        // if task id is invalid (`taskId < nextTaskId`) then 
        // the state will be `TaskState.Unknown`

        require(tasks[taskId].state == state, "invalid");
        _;
    }

    modifier restrictedToTaskManager(uint taskId)
    {
        require(tasks[taskId].manager == msg.sender, "invalid");
        _;
    }

    constructor(address categoryManager_, address memberManager_, address token_)
    {
        categoryManager = CategoryManager(categoryManager_);
        memberManager = MemberManager(memberManager_);
        token = ERC20(token_);

        tasksCount = 0;
        nextTaskId = 0;
    }
    
    /**
    * @dev Add task to manager
    * @param _task External task data
    */
    function addTask(MarketplaceEntities.TaskData calldata _task)
        public
        restrictedTo(MemberManager.Role.Manager)
        returns (uint)
    {
        require(bytes(_task.description).length > 0, "E01");
        require(_task.rewardFreelancer > 0, "E02");
        require(_task.rewardEvaluator > 0, "E03");
        require(categoryManager.isValidCategoryId(_task.category), "E04");
        
        uint taskId = nextTaskId;
        MarketplaceEntities.TaskDataExtended storage taskEx = tasks[taskId];

        taskEx.data = _task;
        taskEx.manager = msg.sender;
        taskEx.state = MarketplaceEntities.TaskState.NotFounded;
        taskEx.readyTimestamp = 0;

        nextTaskId += 1;
        tasksCount += 1;

        emit MarketplaceEntities.TaskAdded(msg.sender, _task.description, taskId);

        return taskId;
    }

    function removeTask(uint taskId)
        public 
        restrictedToTaskManager(taskId)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        refundSponsors(taskId);
        delete tasks[taskId];
        tasksCount -= 1;

        emit MarketplaceEntities.TaskRemoved(msg.sender, taskId);
    }

    function sponsorTask(uint taskId, uint amount)
        public
        restrictedTo(MemberManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        require(amount > 0, "E05");
        requireSenderAllowance(amount);
    
        MarketplaceEntities.TaskDataExtended storage task = tasks[taskId];

        uint targetAmount = task.data.rewardFreelancer + task.data.rewardEvaluator;
    
        // do not receive more than target amount
        require(amount <= targetAmount - task.sponsorshipData.totalAmount, "E09");
        
        token.transferFrom(msg.sender, address(this), amount);
        
        //update sponsorship data in task
        task.sponsorshipData.totalAmount += amount;
        if(task.sponsorshipData.sponsorship[msg.sender] == 0){
            task.sponsorshipData.sponsors.push(msg.sender);
        }
        task.sponsorshipData.sponsorship[msg.sender] += amount;

        emit MarketplaceEntities.TaskSponsored(taskId, msg.sender, amount);

        if(task.sponsorshipData.totalAmount == targetAmount)
        {
            updateTaskState(taskId, MarketplaceEntities.TaskState.Funded);
            emit MarketplaceEntities.TaskFunded(taskId);
        }
    }

    function withdrawSponsorship(uint taskId)
        public
        restrictedTo(MemberManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        MarketplaceEntities.TaskDataExtended storage task = tasks[taskId];
        uint amount = task.sponsorshipData.sponsorship[msg.sender];
        require(amount > 0, "E6");

        token.transfer(msg.sender, amount);
        delete task.sponsorshipData.sponsorship[msg.sender];
        task.sponsorshipData.totalAmount -= amount;

        // also remove from list of sponsors;
        for(uint i = 0; i < task.sponsorshipData.sponsors.length; i++){
            if(task.sponsorshipData.sponsors[i] == msg.sender){
                // put last element on index i and delete last element
                task.sponsorshipData.sponsors[i] = task.sponsorshipData.sponsors[task.sponsorshipData.sponsors.length - 1];
                task.sponsorshipData.sponsors.pop();
                break;
            }
        }

        emit MarketplaceEntities.SponsorshipWidrawed(taskId, msg.sender, amount);

        //  for(uint i=0; i<task.sponsors.length; i++)
        //  {
        //     if(task.sponsors[i].sponsor == msg.sender)
        //     {
        //         token.transfer(task.sponsors[i].sponsor, task.sponsors[i].amount);
                
        //         MarketplaceEntities.deleteFromArray(tasks[taskId].sponsors, i);

        //         emit MarketplaceEntities.SponsorshipWidrawed(taskId, task.sponsors[i].sponsor, task.sponsors[i].amount);
        //         return;
        //     }
        //  }
        //  revert();
    }

    function linkEvaluatorToTask(uint taskId, address evaluator)
        public
        restrictedToTaskManager(taskId)
        taskInState(taskId, MarketplaceEntities.TaskState.Funded)
    {
        assert(tasks[taskId].evaluator == address(0));
        
        require(memberManager.getRole(evaluator) == MemberManager.Role.Evaluator, "E10");
        require(memberManager.getEvaluatorInfo(evaluator).data.categoryId ==  tasks[taskId].data.category, "E11");

        tasks[taskId].evaluator = evaluator;
        tasks[taskId].readyTimestamp = block.timestamp + TASK_NO_FREELANCERS_TIMEOUT_SECONDS;
        updateTaskState(taskId, MarketplaceEntities.TaskState.Ready);

        emit MarketplaceEntities.TaskReady(taskId, evaluator);
    }

    function checkHireTimeout(uint taskId)
        public
        taskInState(taskId, MarketplaceEntities.TaskState.Ready)
    {
        // todo: recheck logic
        // `applyForTask` and `hireFreelancer` should success if the timeout is over?

        require(tasks[taskId].readyTimestamp >= block.timestamp, "E12");
        require(tasks[taskId].freelancersData.freelancers.length == 0, "E13");

        refundSponsors(taskId);
        updateTaskState(taskId, MarketplaceEntities.TaskState.TimeoutOnHiring);

        emit MarketplaceEntities.TaskHiringTimeout(taskId);
    }

    function applyForTask(uint taskId)
        public
        restrictedTo(MemberManager.Role.Freelancer)
        taskInState(taskId, MarketplaceEntities.TaskState.Ready)
    {
        require(memberManager.getFreelancerInfo(msg.sender).data.categoryId == tasks[taskId].data.category, "E14");
        requireSenderAllowance(tasks[taskId].data.rewardEvaluator);
        token.transferFrom(msg.sender, address(this), tasks[taskId].data.rewardEvaluator);

        tasks[taskId].freelancersData.freelancers.push(msg.sender);

        emit MarketplaceEntities.TaskFreelancerApplied(taskId, msg.sender);
    }

    function hireFreelancer(uint taskId, uint freelancerIdx)
        public
        restrictedToTaskManager(taskId)
        taskInState(taskId, MarketplaceEntities.TaskState.Ready)
    {
        require(freelancerIdx < tasks[taskId].freelancersData.freelancers.length, "E15");

        for (uint i=0; i<tasks[taskId].freelancersData.freelancers.length; i++)
        {
            if( i != freelancerIdx)
            {
                token.transfer(tasks[taskId].freelancersData.freelancers[i], tasks[taskId].data.rewardEvaluator);
            }
        }

        tasks[taskId].freelancersData.chosen = tasks[taskId].freelancersData.freelancers[freelancerIdx];
        
        // swap selected freelancer with the one at index 0
        // address temp_address = tasks[taskId].freelancers[0];
        // tasks[taskId].freelancers[0] = tasks[taskId].freelancers[freelancerIdx];
        // tasks[taskId].freelancers[freelancerIdx] = temp_address;
        
        updateTaskState(taskId, MarketplaceEntities.TaskState.WorkingOnIt);

        emit MarketplaceEntities.TaskFreelancerHired(taskId, tasks[taskId].freelancersData.chosen);
    }

    function finishTask(uint taskId)
        public
        taskInState(taskId, MarketplaceEntities.TaskState.WorkingOnIt)
    {
        require(tasks[taskId].freelancersData.chosen == msg.sender, "E16");
        updateTaskState(taskId, MarketplaceEntities.TaskState.Finished);

        emit MarketplaceEntities.TaskFinished(taskId);
    }

    function reviewTask(uint taskId, bool accept_results)
        public 
        restrictedToTaskManager(taskId)
        taskInState(taskId, MarketplaceEntities.TaskState.Finished)
    {
        if (accept_results) 
        {
            uint reward = tasks[taskId].data.rewardEvaluator * 2 + tasks[taskId].data.rewardFreelancer;
            address freelancer = tasks[taskId].freelancersData.chosen;
                        
            memberManager.updateFreelancerReputation(freelancer, true);
            token.transfer(freelancer, reward);

            updateTaskState(taskId, MarketplaceEntities.TaskState.Accepted);
        }
        else 
        {
            updateTaskState(taskId, MarketplaceEntities.TaskState.WaitingForEvaluation);
        }

        emit MarketplaceEntities.TaskReviewed(taskId, accept_results);
    }

    function reviewAsEvaluator(uint taskId, bool accept_result)
        public
        taskInState(taskId, MarketplaceEntities.TaskState.WaitingForEvaluation)
    {
        require(tasks[taskId].evaluator == msg.sender, "E17");

        address freelancer = tasks[taskId].freelancersData.chosen;
        address evaluator = tasks[taskId].evaluator;

        if (accept_result)
        {

            memberManager.updateFreelancerReputation(freelancer, true);
            token.transfer(freelancer, tasks[taskId].data.rewardEvaluator + tasks[taskId].data.rewardFreelancer);
            token.transfer(evaluator, tasks[taskId].data.rewardEvaluator);

            updateTaskState(taskId, MarketplaceEntities.TaskState.AcceptedByEvaluator);
        } else 
        {
            memberManager.updateFreelancerReputation(freelancer, false);
            refundSponsors(taskId);
            token.transfer(evaluator, tasks[taskId].data.rewardEvaluator);
            
            updateTaskState(taskId, MarketplaceEntities.TaskState.RejectedByEvaluator);
        }

        emit MarketplaceEntities.TaskReviewedByEvaluator(taskId, accept_result);
    }
    
    function updateTaskState(uint _taskId, MarketplaceEntities.TaskState _state)
    internal
    {
        tasks[_taskId].state = _state;
        emit MarketplaceEntities.TaskStateChanged(_taskId, _state);
    }

    function refundSponsors(uint taskId)
        internal
    {
        MarketplaceEntities.TaskDataExtended storage task = tasks[taskId];

        for(uint i = 0;i < task.sponsorshipData.sponsors.length; i++){
            address sponsorAddr = task.sponsorshipData.sponsors[i];
            token.transfer(sponsorAddr, task.sponsorshipData.sponsorship[sponsorAddr]);
        }

        // todo: should keep sponsors list as history?

        // while(tasks[taskId].sponsors.length != 0)
        // {
        //     uint idx = tasks[taskId].sponsors.length - 1;
        //     token.transfer(tasks[taskId].sponsors[idx].sponsor, tasks[taskId].sponsors[idx].amount);
        //     tasks[taskId].sponsors.pop();
        // }
    }

    function requireSenderAllowance(uint amount)
        internal
        view
    {
        uint amountAllowed = token.allowance(msg.sender, address(this));
        uint senderBalance = token.balanceOf(msg.sender);
        require(amountAllowed <= senderBalance, "E06");
        require(amount <= amountAllowed, "E07");
    }

    // function getTaskData(uint taskId)
    //     external
    //     view
    //     returns (MarketplaceEntities.TaskDataExtended memory)
    // {
    //         require(taskId < nextTaskId, "Invalid Id!");
    //         return tasks[taskId];
    // }

    function getTasksCount() 
        public 
        view
        returns(uint)
    {
        return tasksCount;
    }
}