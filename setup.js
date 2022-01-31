const TaskManager = artifacts.require("TaskManager");
const CategoryManager = artifacts.require("CategoryManager");
const MemberManager = artifacts.require("MemberManager");
const Token = artifacts.require("Token");
const fs = require("fs");

freelancers = []
sponsors = []
managers = []
evaluators = []

module.exports = async function (callback) {
    try {
        categoryManager = await CategoryManager.deployed();
        taskManager = await TaskManager.deployed();
        memberManager = await MemberManager.deployed();
        token = await Token.deployed();

        let all_addresses = {
            TaskManager: taskManager.address
        };
        let file = `
            export default ${JSON.stringify(all_addresses)};`;

        fs.writeFile(__dirname + '/src/addresses.js', file, (err) => {
            if (err) throw err;
        });

        await Promise.all([
            categoryManager.addCategory("c1"),
            categoryManager.addCategory("c2"),
            categoryManager.addCategory("c3"),
        ]);

        await memberManager.joinAsManager({
            name: 'eu'
        });

        tx = await taskManager.addTask({
            description: "This is a description of the task",
            rewardFreelancer: 10,
            rewardEvaluator: 10,
            category: 0
        })
    } catch (e) {
        console.log(e);
    } finally {
        callback()
    }
}