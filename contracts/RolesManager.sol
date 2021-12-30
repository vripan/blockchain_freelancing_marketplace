// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
import "./Ownable.sol";

contract RolesManager is Ownable 
{
    struct FreelancerData
    {
        string name;
        uint categoryId;
    }

    struct FreelancerDataExtended
    {
        FreelancerData data;
        uint8 rep; // constrained to interval [1, 10] -> initial setata la 5
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

    event MemberJoined(Role role, string name, address address_);

    modifier notJoined()
    {
        require(roles[msg.sender] == Role.Unknown, "Already joined!");
        _;
    }

    function StringifiedRole(Role _role) 
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

    function joinAsFreelancer(FreelancerData calldata _data) 
        external
        notJoined
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");

        //todo: maybe add calldata validators for each role?
        //todo: validate category?
        roles[msg.sender] = Role.Freelancer;
        freelancers[msg.sender] = FreelancerDataExtended(
            {
                data : _data,
                rep : 5
            }
        );

        membersCount++;
        emit MemberJoined(Role.Freelancer, _data.name, msg.sender);
    }

    function joinAsManager(ManagerData calldata _data) 
        external
        notJoined
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");

        roles[msg.sender] = Role.Manager;
        managers[msg.sender] = ManagerDataExtended(
            {
                data : _data
            }
        );

        membersCount++;
        emit MemberJoined(Role.Manager, _data.name, msg.sender);
    }
     
    function joinAsSponsor(SponsorData calldata _data) 
        external
        notJoined
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");

        roles[msg.sender] = Role.Sponsor;
        sponsors[msg.sender] = SponsorDataExtended(
            {
                data : _data
            }
        );

        membersCount++;
        emit MemberJoined(Role.Sponsor, _data.name, msg.sender);
    }

    function joinAsEvaluator(EvaluatorData calldata _data) 
        external
        notJoined
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");
        //todo: validate category?
        
        roles[msg.sender] = Role.Evaluator;
        evaluators[msg.sender] = EvaluatorDataExtended(
            {
                data : _data
            }
        );

        membersCount++;
        emit MemberJoined(Role.Evaluator, _data.name, msg.sender);
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
