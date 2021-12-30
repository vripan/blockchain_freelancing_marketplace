// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

library MarketplaceEntities
{
    struct SponsorshipInfo
    {
        address sponsor;
        uint amount;
    }

    enum TaskState { NotFounded, Funded, Ready, WorkingOnIt, Finished, Accepted, WaitingForEvaluation, AcceptedByEvaluator, RejectedByEvaluator}

    struct TaskData
    {
        string description;
        uint rewardFreelancer;
        uint rewardEvaluator;
        uint category;
    }

    struct TaskDataExtended
    {
        TaskData data;
        address manager;
        SponsorshipInfo[] sponsors;
        address[] freelancers;
        address evaluator;
        TaskState state;
        uint256 readyTimestamp;
    }
}