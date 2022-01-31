// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

library MarketplaceEntities
{
    //external usage
    struct SponsorshipInfo
    {
        address sponsorAddr;
        uint sponsorshipAmount;
    }

    struct SponsorshipData
    {
        address[] sponsors;
        mapping(address => uint) sponsorship;
        uint totalAmount;
    }

    struct SponsorshipDataExternal{
        SponsorshipInfo[] sponsors;
        uint totalAmount;
    }

    struct FreelancersData
    {
        address[] freelancers;
        address chosen;
    }

    enum TaskState { Unknown, NotFounded, Funded, Ready, WorkingOnIt, Finished, Accepted, WaitingForEvaluation, AcceptedByEvaluator, RejectedByEvaluator, TimeoutOnHiring, TimeoutOnEvaluation}

    struct TaskData
    {
        string  description;
        uint    rewardFreelancer;
        uint    rewardEvaluator;
        uint    category;
    }

    struct TaskDataExternal
    {
        TaskData data;
        address manager;
        SponsorshipDataExternal sponsorshipData;
        FreelancersData freelancersData;
        address evaluator;
        TaskState state;
        uint256 readyTimestamp;
    }

    struct TaskDataExtended
    {
        TaskData data;
        address manager;
        SponsorshipData sponsorshipData;
        FreelancersData freelancersData;
        address evaluator;
        TaskState state;
        uint256 readyTimestamp;
    }

    event TaskAdded(address owner, string description, uint id);
    event TaskRemoved(address owner, uint taskId);
    event TaskStateChanged(uint taskId, TaskState state);
    event SponsorshipWidrawed(uint taskId, address sponsor, uint amount);
    event TaskSponsored(uint taskId, address sponsor, uint amount);
    event TaskFunded(uint taskId);
    event TaskReady(uint taskId, address evaluator);
    event TaskFreelancerApplied(uint taskId, address freelancer);
    event TaskFreelancerHired(uint taskId, address freelancer);
    event TaskFinished(uint taskId);
    event TaskReviewed(uint taskId, bool accepted);
    event TaskReviewedByEvaluator(uint taskId, bool accepted);
    event TaskHiringTimeout(uint taskId);
}