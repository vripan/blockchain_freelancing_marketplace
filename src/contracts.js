import * as ethers from "ethers";
import TaskManager from './contracts/TaskManager.json';
import MemberManager from './contracts/MemberManager.json';
import CategoryManager from './contracts/CategoryManager.json';
import Token from './contracts/Token.json';
import ContractAdresses from './addresses';

let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
let tempSigner = tempProvider.getSigner();

let mm = new ethers.Contract(ContractAdresses.MemberManager, MemberManager.abi, tempSigner);
mm.Role = {
    Unknown: 0,
    Freelancer: 1,
    Manager: 2,
    Sponsor: 3,
    Evaluator: 4
}

export default {
    taskManager: new ethers.Contract(ContractAdresses.TaskManager, TaskManager.abi, tempSigner),
    categoryManager: new ethers.Contract(ContractAdresses.CategoryManager, CategoryManager.abi, tempSigner),
    memberManager: mm,
    tokenC: new ethers.Contract(ContractAdresses.Token, Token.abi, tempSigner),
    TaskState: ["Unknown", "NotFounded", "Funded", "Ready", "WorkingOnIt", "Finished", "Accepted", "WaitingForEvaluation", "AcceptedByEvaluator", "RejectedByEvaluator", "TimeoutOnHiring", "TimeoutOnEvaluation"],
    TaskStateM: {
        "Unknown": 0,
        "NotFounded": 1,
        "Funded": 2,
        "Ready": 3,
        "WorkingOnIt": 4,
        "Finished": 5,
        "Accepted": 6,
        "WaitingForEvaluation": 7,
        "AcceptedByEvaluator": 8,
        "RejectedByEvaluator": 9,
        "TimeoutOnHiring": 10,
        "TimeoutOnEvaluation": 11
    }
};