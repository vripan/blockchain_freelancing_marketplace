// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

library MarketplaceEntities
{
    struct SponsorshipInfo
    {
        address sponsor;
        uint amount;
    }

    enum TaskState { Unknown, NotFounded, Funded, Ready, WorkingOnIt, Finished, Accepted, WaitingForEvaluation, AcceptedByEvaluator, RejectedByEvaluator, TimeoutOnHiring, TimeoutOnEvaluation}

    struct TaskData
    {
        string  description;
        uint    rewardFreelancer;
        uint    rewardEvaluator;
        uint    category;
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

    event TaskAdded(address owner, string description, uint id);
    event TaskRemoved(address owner, uint taskId);
    event SponsorshipWidrawed(uint taskId, address sponsor, uint amount);
    event TaskSponsored(uint taskId, address sponsor, uint amount);
    event TaskFunded(uint taskId);
    event TaskReady(uint taskId, address evaluator);
    event TaskFreelancerApplied(uint taskId, address freelancer);
    event TaskFreelancerHired(uint taskId, address freelancer);
    event TaskFinished(uint taskId);
    event TaskReviewed(uint taskId, bool accepted);
    event TaskHiringTimeout(uint taskId);
    function deleteFromArray(SponsorshipInfo[] storage array, uint index)
        public
    {
        unchecked {
            for(uint shIdx = index; shIdx < array.length - 1; shIdx++)
            {
                array[shIdx] = array[shIdx + 1];
            }
            array.pop();
        }
    }
}