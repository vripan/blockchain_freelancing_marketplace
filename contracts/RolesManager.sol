// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
import "./Ownable.sol";

contract RolesManager is Ownable 
{
    struct FreelancerData
    {
        string name;
        uint categoryId;
        uint8 rep; // constrained to interval [1, 10]
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

    enum Role { Unknown, Freelancer, Manager, Sponsor, Evaluator }

    mapping(address => Role) internal roles;

    mapping(address => FreelancerData) internal freelancers;
    mapping(address => ManagerData) internal managers;
    mapping(address => SponsorData) internal sponsors;
    mapping(address => EvaluatorData) internal evaluators;

    uint internal membersCount;

    event MemberJoined(Role role, string name, address address_);

    function StringifiedRole(Role role) 
        public 
        pure
        returns (string memory)
    {
        // todo: this
    }

    function joinAsFreelancer(FreelancerData calldata data) 
        public
    {
        // todo: register

        emit MemberJoined(Role.Freelancer, data.name, msg.sender);
    }

    function joinAsManager(ManagerData calldata data) 
        public
    {
        // todo: register

        emit MemberJoined(Role.Manager, data.name, msg.sender);
    }
     
    function joinAsSponsor(SponsorData calldata data) 
        public
    {
        // todo: register

        emit MemberJoined(Role.Sponsor, data.name, msg.sender);
    }

    function joinAsEvaluator(EvaluatorData calldata data) 
        public
    {
        // todo: register

        emit MemberJoined(Role.Evaluator, data.name, msg.sender);
    }

    function getEvaluatorInfo(address _address) 
        public
        view 
        returns(EvaluatorData memory)
    {
        assert(getRole(_address) == Role.Evaluator);
        return evaluators[_address];
    }

    function getRole(address address_) 
        public 
        view 
        returns(Role)
    {
        // todo: get role

        return Role.Unknown;
    }

    function getMembersCount()
        public
        view
        returns(uint)
    {
        return 0;
    }


}
