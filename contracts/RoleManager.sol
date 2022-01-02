// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
import "./CategoryManager.sol";

contract RoleManager 
{
    struct FreelancerData
    {
        string name;
        uint categoryId;
    }

    struct FreelancerDataExtended
    {
        FreelancerData data;
        uint8 rep;
    }

    struct ManagerData
    {
        string name;
    }

    struct ManagerDataExtended
    {
        ManagerData data;
    }

    struct SponsorData
    {
        string name;
    }

    struct SponsorDataExtended
    {
        SponsorData data;
    }

    struct EvaluatorData
    {
        string name;
        uint categoryId;
    }

    struct EvaluatorDataExtended
    {
        EvaluatorData data;
    }

    enum Role { Unknown, Freelancer, Manager, Sponsor, Evaluator }

    mapping(address => Role) internal roles;

    mapping(address => FreelancerDataExtended) internal freelancers;
    mapping(address => ManagerDataExtended) internal managers;
    mapping(address => SponsorDataExtended) internal sponsors;
    mapping(address => EvaluatorDataExtended) internal evaluators;

    uint internal membersCount = 0;
    CategoryManager categoryManager;

    event MemberJoined(Role role, string name, address address_);

    modifier notJoined(address address_)
    {
        require(roles[address_] == Role.Unknown, "Already joined!");
        _;
    }

    constructor(address categoryManager_)
    {
        require(categoryManager_ != address(0), "invalid address");
        categoryManager = CategoryManager(categoryManager_);
    }

    function stringifiedRole(Role _role) 
        public
        pure
        returns (string memory)
    {
        return 
            _role == Role.Freelancer ? "Freelancer" :
            _role == Role.Manager ? "Manager" :
            _role == Role.Sponsor ? "Sponsor" :
            _role == Role.Evaluator ? "Evaluator" :
            "Unknown";
    }

    function joinAsFreelancer(address address_, FreelancerData calldata _data) 
        public
        notJoined(address_)
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");
        require(categoryManager.isValidCategoryId(_data.categoryId), "invalid category id");
        
        roles[address_] = Role.Freelancer;
        freelancers[address_] = FreelancerDataExtended(
            {
                data : _data,
                rep : 5
            }
        );

        membersCount++;
        emit MemberJoined(Role.Freelancer, _data.name, address_);
    }

    function joinAsManager(address address_, ManagerData calldata _data) 
        public
        notJoined(address_)
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");

        roles[address_] = Role.Manager;
        managers[address_] = ManagerDataExtended(
            {
                data : _data
            }
        );

        membersCount++;
        emit MemberJoined(Role.Manager, _data.name, address_);
    }
     
    function joinAsSponsor(address address_, SponsorData calldata _data) 
        public
        notJoined(address_)
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");

        roles[address_] = Role.Sponsor;
        sponsors[address_] = SponsorDataExtended(
            {
                data : _data
            }
        );

        membersCount++;
        emit MemberJoined(Role.Sponsor, _data.name, address_);
    }

    function joinAsEvaluator(address address_, EvaluatorData calldata _data) 
        public
        notJoined(address_)
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");
        require(categoryManager.isValidCategoryId(_data.categoryId), "invalid");
        
        roles[address_] = Role.Evaluator;
        evaluators[address_] = EvaluatorDataExtended(
            {
                data : _data
            }
        );

        membersCount++;
        emit MemberJoined(Role.Evaluator, _data.name, address_);
    }

    function getEvaluatorInfo(address _address) 
        public
        view 
        returns(EvaluatorDataExtended memory)
    {
        assert(getRole(_address) == Role.Evaluator);
        return evaluators[_address];
    }

    function getRole(address _address) 
        public 
        view 
        returns(Role)
    {
        return roles[_address];
    }

    function getMembersCount()
        public
        view
        returns(uint)
    {
        return membersCount;
    }
}
