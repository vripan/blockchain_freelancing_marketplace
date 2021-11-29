pragma solidity ^0.8.0;

library MarketplaceEntities
{
    struct SponsorshipInfo
    {
        address sponsor;
        uint amount;
    }

    enum TaskState { NotFounded, Funded, Ready, WorkingOnIt, Finished, Accepted }

    struct TaskData
    {
        string description;
        uint rewardFreelancer;
        uint rewardEvaluator;
        uint category;
        address manager;
        SponsorshipInfo[] sponsors;
        address[] freelancers;
        TaskState state;
        uint256 readyTimestamp;
    }

    struct FreelancerData
    {
        string name;
        uint categoryId;
        uint8 rep;
    }

    struct ManagerData
    {
        string name;
    }

    struct SponsorData
    {
        string name;
    }

    struct EvaluatorData
    {
        string name;
        uint categoryId;
    }

    enum Role { Freelancer, Manager, Sponsor, Evaluator }
    function StringifiedRole(Role role) 
        public 
        pure
        returns (string)
    {
        // todo: this
    }
}