// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;
import "./CategoryManager.sol";

library MemberData 
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

}

contract MemberManager is Ownable
{
    uint internal membersCount = 0;
    CategoryManager categoryManager;

    mapping(address => Role) internal roles;

    address[] freelancersArr;
    address[] managersArr;
    address[] sponsorsArr;
    address[] evaluatorsArr;

    mapping(address => MemberData.FreelancerDataExtended) internal freelancers;
    mapping(address => MemberData.ManagerDataExtended) internal managers;
    mapping(address => MemberData.SponsorDataExtended) internal sponsors;
    mapping(address => MemberData.EvaluatorDataExtended) internal evaluators;

    enum Role { Unknown, Freelancer, Manager, Sponsor, Evaluator }
    
    event MemberJoined(Role role, string name, address address_);
    event FreelancerReputationChanged(address freelancer, bool increase);

    modifier notJoined()
    {
        require(roles[msg.sender] == Role.Unknown, "Already joined!");
        _;
    }

    constructor(address categoryManager_)
    {
        require(categoryManager_ != address(0), "invalid address");
        categoryManager = CategoryManager(categoryManager_);
    }

    function stringifiedRole(Role _role) 
        external
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

    function joinAsFreelancer(MemberData.FreelancerData calldata _data) 
        external
        notJoined
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");
        require(categoryManager.isValidCategoryId(_data.categoryId), "invalid category id");
        
        roles[msg.sender] = Role.Freelancer;
        freelancers[msg.sender] = MemberData.FreelancerDataExtended(
            {
                data : _data,
                rep : 5
            }
        );

        freelancersArr.push(msg.sender);

        membersCount++;
        emit MemberJoined(Role.Freelancer, _data.name, msg.sender);
    }

    function joinAsManager(MemberData.ManagerData calldata _data) 
        external
        notJoined
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");

        roles[msg.sender] = Role.Manager;
        managers[msg.sender] = MemberData.ManagerDataExtended(
            {
                data : _data
            }
        );

        managersArr.push(msg.sender);

        membersCount++;
        emit MemberJoined(Role.Manager, _data.name, msg.sender);
    }
     
    function joinAsSponsor(MemberData.SponsorData calldata _data) 
        external
        notJoined
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");

        roles[msg.sender] = Role.Sponsor;
        sponsors[msg.sender] = MemberData.SponsorDataExtended(
            {
                data : _data
            }
        );

        sponsorsArr.push(msg.sender);

        membersCount++;
        emit MemberJoined(Role.Sponsor, _data.name, msg.sender);
    }

    function joinAsEvaluator(MemberData.EvaluatorData calldata _data) 
        external
        notJoined
    {
        require(bytes(_data.name).length != 0, "Name can not be empty!");
        require(categoryManager.isValidCategoryId(_data.categoryId), "invalid");
        
        roles[msg.sender] = Role.Evaluator;
        evaluators[msg.sender] = MemberData.EvaluatorDataExtended(
            {
                data : _data
            }
        );

        evaluatorsArr.push(msg.sender);

        membersCount++;
        emit MemberJoined(Role.Evaluator, _data.name, msg.sender);
    }

    function updateFreelancerReputation(address _address, bool increase)
        public
        restricted
    {
        if (increase) 
        {
            if(freelancers[_address].rep <= 9)
                freelancers[_address].rep += 1;
        } else 
        {
            if (freelancers[_address].rep >= 2) 
            freelancers[_address].rep -= 1;
        }

        emit FreelancerReputationChanged(_address, increase);
    }       
   
   /**
    * @dev Get unchecked role info
    * @param _address Role address
    */
    function getEvaluatorInfo(address _address) 
        public
        view 
        returns(MemberData.EvaluatorDataExtended memory)
    {
        MemberData.EvaluatorDataExtended memory data = evaluators[_address];
        assert(bytes(data.data.name).length != 0);
        
        return data;
    }

    function getManagerInfo(address _address)
        public
        view
        returns(MemberData.ManagerDataExtended memory)
    {
        MemberData.ManagerDataExtended memory data = managers[_address];
        assert(bytes(data.data.name).length != 0);

        return data;
    }

    function getSponsorInfo(address _address)
        public
        view
        returns(MemberData.SponsorDataExtended memory)
    {
        MemberData.SponsorDataExtended memory data = sponsors[_address];
        assert(bytes(data.data.name).length != 0);

        return data;
    }

    function getFreelancerInfo(address _address)
        public
        view
        returns(MemberData.FreelancerDataExtended memory)
    {
        MemberData.FreelancerDataExtended memory data = freelancers[_address];
        assert(bytes(data.data.name).length != 0);

        return data;
    }

    function getFreelancersArray()
        external
        view
        returns(address[] memory)
    {
        return freelancersArr;
    }
    
    function getManagersArray()
        external
        view
        returns(address[] memory)
    {
        return managersArr;
    } 
    
    function getSponsorsArray()
        external
        view
        returns(address[] memory)
    {
        return sponsorsArr;
    } 
    
    function getEvaluatorsArray()
        external
        view
        returns(address[] memory)
    {
        return evaluatorsArr;
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
