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

    enum Phase {
        Zero, // Initializarea marketplace-ului 
        One, // Crearea si finantarea unui nou task (NotFounded, Founded, Ready)
        Two, // Aplicarea pentru realizarea unui task (Ready)
        Three, // Executia taskului (Ready, WorkingOnIt, Finished, WaitingForEvaluation)
        Four // Arbitrajul 
    }

    modifier at(Phase phase)
    {
        _;
    }

    modifier restrictedTo(RolesManager.Role role)
    {
        require(getRole(msg.sender) == role, "operation restricted for that role");
        _;
    }

    modifier isValid(MarketplaceEntities.TaskData calldata data)
    {
        require(bytes(data.description).length > 0, "invalid description");
        require(data.rewardFreelancer > 0, "invalid");
        require(data.rewardEvaluator > 0, "invalid");
        require(isValidCategoryId(data.category), "invalid");
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

    modifier canEvaluate(address evaluator, uint taskId)
    {
        // remove this but make sure the code compile
        // todo: this (check same category)
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
        at(Phase.One)
        isValid(task)
        restrictedTo(RolesManager.Role.Manager)
        returns (uint)
    {
        MarketplaceEntities.TaskDataExtended memory taskEx = new MarketplaceEntities.TaskDataExtended();
        taskEx.data = task;
        taskEx.manager = msg.sender;
        taskEx.state = MarketplaceEntities.TaskState.NotFounded;
        taskEx.readyTimestamp = 0;

        uint taskId = tasksCount;
        tasks[taskId] = taskEx;
        tasksCount += 1;

        emit TaskAdded(msg.sender, task.description, taskId);

        return taskId;
    }

    function removeTask(uint taskId)
        public 
        at(Phase.One)
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
        at(Phase.One)
        restrictedTo(RolesManager.Role.Sponsor)
        taskInState(taskId, MarketplaceEntities.TaskState.NotFounded)
    {
        uint amountAllowed = token.allowance(msg.sender, address(this));
        require(amount > 0, "invalid sponsorship value");
        require(amount <= amountAllowed, "invalid");
    
        SponsorshipInfo sponsorship = SponsorshipInfo();
        sponsorship.sponsor = msg.sender;
        sponsorship.amount = amount;
        
        // todo: check if this created a copy
        TaskDataExtended task = tasks[taskId];

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

        if(existingAmount == sponsorship)
        {
            task.state = MarketplaceEntities.TaskState.Funded;
            emit TaskFunded();
        }
    }

    function withdrawSponsorship(uint taskId, uint amount)
        public
        at(Phase.One)
        restrictedTo(RolesManager.Role.Sponsor)
    {
        // 
    }

    function linkEvaluatorToTask(uint taskId, address evaluator)
        public
        at(Phase.One)
        restrictedTo(RolesManager.Role.Manager)
        taskInState(taskId, MarketplaceEntities.TaskState.Funded)
        restrictedToTaskManager(taskId)
        canEvaluate(evaluator, taskId)
    {
        // transition from funded to ready
    }

    function applyForTask(uint taskId)
        public
        at(Phase.Two)
        restrictedTo(RolesManager.Role.Freelancer)
        canApply(msg.sender, taskId)
    {
        // todo: this
    }

    function hireFreelancer(uint taskId, address freelancer)
        public
        at(Phase.Three)
        restrictedTo(RolesManager.Role.Manager)
        taskInState(taskId, MarketplaceEntities.TaskState.Ready)
        restrictedToTaskManager(taskId)
    {
        // transition from ready to working on it
    }

    function finishTask(uint taskId)
        public
        at(Phase.Three)
        restrictedTo(RolesManager.Role.Freelancer)
    {
        // transition from working on it to finished
    }

    function checkTask(uint taskId)
        public
        at(Phase.Three)
    {
        // transition from finished to accepted or WaitingForEvaluation
    }
}