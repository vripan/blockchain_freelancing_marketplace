import * as ethers from "ethers";
import TaskManager from './contracts/TaskManager.json';
import MemberManager from './contracts/MemberManager.json';
import ContractAdresses from './addresses';

let tempProvider = new ethers.providers.Web3Provider(window.ethereum);
let tempSigner = tempProvider.getSigner();

export default {
    taskManager: new ethers.Contract(ContractAdresses.TaskManager, TaskManager.abi, tempSigner),
    memberManager: new ethers.Contract(ContractAdresses.MemberManager, MemberManager.abi, tempSigner)
};