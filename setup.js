const TaskManager = artifacts.require("TaskManager");
const CategoryManager = artifacts.require("CategoryManager");
const MemberManager = artifacts.require("MemberManager");
const Token = artifacts.require("Token");
const fs = require("fs");

Role = {
    Unknown: 0,
    Freelancer: 1,
    Manager: 2,
    Sponsor: 3,
    Evaluator: 4
}

async function register_user(memberManager, token, wallet, name, new_role, category = 0) {
    role = await memberManager.getRole(wallet)

    await token.mint({ from: wallet });

    if (role != 0) {
        console.log("Wallet already registered with " + role + " and new role " + new_role);
        return;
    }

    switch (new_role) {
        case Role.Freelancer:
            await memberManager.joinAsFreelancer({
                name: name,
                categoryId: category
            }, {
                from: wallet
            });
            break;
        case Role.Manager:
            await memberManager.joinAsManager({
                name: name
            }, {
                from: wallet
            });
            break;
        case Role.Sponsor:
            await memberManager.joinAsSponsor({
                name: name
            }, {
                from: wallet
            });
            break;
        case Role.Evaluator:
            await memberManager.joinAsEvaluator({
                name: name,
                categoryId: category
            }, {
                from: wallet
            });
            break;
    }
}

async function setup() {
    categoryManager = await CategoryManager.deployed();
    taskManager = await TaskManager.deployed();
    memberManager = await MemberManager.deployed();
    token = await Token.deployed();

    accounts = await web3.eth.getAccounts()

    // deploy contracts addresses
    //
    let all_addresses = {
        TaskManager: taskManager.address,
        CategoryManager: categoryManager.address,
        MemberManager: memberManager.address,
        Token: token.address
    };
    let file = `
            export default ${JSON.stringify(all_addresses)};`;

    fs.writeFile(__dirname + '/src/addresses.js', file, (err) => {
        if (err) throw err;
    });


    // generate categories
    //
    await Promise.all([
        categoryManager.addCategory("DevOps"),
        categoryManager.addCategory("Security"),
        categoryManager.addCategory("Database"),
    ]);

    // add members
    //
    await Promise.all([
        register_user(memberManager, token, accounts[1], "Manager [1]", Role.Manager),
        register_user(memberManager, token, accounts[2], "Manager [2]", Role.Manager),
        register_user(memberManager, token, accounts[3], "Freelancer [3]", Role.Freelancer, 1),
        register_user(memberManager, token, accounts[4], "Freelancer [4]", Role.Freelancer, 1),
        register_user(memberManager, token, accounts[5], "Sponsor [5]", Role.Sponsor),
        register_user(memberManager, token, accounts[6], "Sponsor [6]", Role.Sponsor),
        register_user(memberManager, token, accounts[7], "Evaluator [7]", Role.Evaluator, 1),
        register_user(memberManager, token, accounts[8], "Evaluator [8]", Role.Evaluator, 1),
    ])

    // add test tasks
    //
    await taskManager.addTask({
        description: "Integrate build environment with GithHub Actions",
        rewardFreelancer: 10,
        rewardEvaluator: 10,
        category: 0
    }, {
        from: accounts[1]
    })

    await taskManager.addTask({
        description: "Analyze CVE-2021-44228: Log4j exploit",
        rewardFreelancer: 5,
        rewardEvaluator: 3,
        category: 1
    }, {
        from: accounts[1]
    })

}

module.exports = async function (callback) {
    try {
        await setup()
    } catch (e) {
        console.log(e);
    } finally {
        callback()
    }
}