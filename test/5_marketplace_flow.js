const TaskManager = artifacts.require("TaskManager");
const CategoryManager = artifacts.require("CategoryManager");
const MemberManager = artifacts.require("MemberManager");
const Token = artifacts.require("Token");

const { time } = require("@openzeppelin/test-helpers");
const { expectEvent } = require("@openzeppelin/test-helpers");


const truffleAssert = require('truffle-assertions');

freelancers = []
sponsors = []
managers = []
evaluators = []

contract("TaskManager", accounts => {
    it("init market with categories", async () => {
        categoryManager = await CategoryManager.deployed();

        await Promise.all([
            categoryManager.addCategory("c1"),
            categoryManager.addCategory("c2"),
            categoryManager.addCategory("c3"),
        ]);

        categoriesCount = await categoryManager.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 3, "invalid");
    });
    it("init market with members", async () => {
        taskManager = await TaskManager.deployed();
        memberManager = await MemberManager.deployed();
        token = await Token.deployed();

        entity_name = "entity"
        chunk_size = accounts.length / 4;
        for(i = 0; i<accounts.length; i++)
        {
            token.mint({from: accounts[i]});
            
            if(i >= 0 && i < chunk_size )
            {
                freelancers.push(accounts[i]);
                await memberManager.joinAsFreelancer({name:entity_name, categoryId:0}, {from:accounts[i]})
            }
            else if(i >= chunk_size && i < chunk_size * 2)
            {
                sponsors.push(accounts[i]);
                await memberManager.joinAsSponsor({name:entity_name}, {from:accounts[i]})
            }
            else if(i >= chunk_size * 2 && i < chunk_size * 3)
            {
                managers.push(accounts[i]);
                await memberManager.joinAsManager({name:entity_name}, {from:accounts[i]})
            }
            else if(i >= chunk_size * 3&& i < chunk_size * 4)
            {
                evaluators.push(accounts[i]);
                await memberManager.joinAsEvaluator({name:entity_name, categoryId:0}, {from:accounts[i]})
            }
        }

        membersCount = await memberManager.getMembersCount();
        assert.equal(membersCount.toNumber(), accounts.length, "invalid");
    });

    it("create task", async () => {
        tasksCount = await taskManager.getTasksCount();
        assert.equal(tasksCount.toNumber(), 0);

        tx = await taskManager.addTask({description:"description", rewardFreelancer: 10, rewardEvaluator: 10, category: 0}, {from: managers[0]})
        truffleAssert.eventEmitted(tx, "TaskAdded", ev => {
            return ev.id == 0
                && ev.description.length > 0
                && ev.owner == managers[0]
        });

        tasksCount = await taskManager.getTasksCount();
        assert.equal(tasksCount.toNumber(), 1);
    });
    
    it("partially sponsor task", async () => {
        mintAmount = await token.mintAmount();

        // no token allowance
        await truffleAssert.fails(
            taskManager.sponsorTask(0, 10, {from: sponsors[0]}),
            truffleAssert.ErrorType.REVERT
        );

        await token.approve(taskManager.address, 20, {from: sponsors[0]});
        tx = await taskManager.sponsorTask(0, 5, {from: sponsors[0]});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 0
                && ev.sponsor == sponsors[0]
                && ev.amount == 5
        });
        allowance = await token.allowance(sponsors[0], taskManager.address);
        assert.equal(allowance.toNumber(), 15);

        // widraw sponsorship
        tx = await taskManager.withdrawSponsorship(0, {from: sponsors[0]});
        truffleAssert.eventEmitted(tx, "SponsorshipWidrawed", ev => {
            return ev.taskId == 0
                && ev.sponsor == sponsors[0]
                && ev.amount == 5
        });

        sponsor_0_balance = await token.balanceOf(sponsors[0]);
        assert.equal(sponsor_0_balance.toNumber(), mintAmount.toNumber());

        // sponsor back
        tx = await taskManager.sponsorTask(0, 5, {from: sponsors[0]});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 0
                && ev.sponsor == sponsors[0]
                && ev.amount == 5
        });
        allowance = await token.allowance(sponsors[0], taskManager.address);
        assert.equal(allowance.toNumber(), 10);

        // sponsor task multiple times
        await truffleAssert.fails(
            taskManager.sponsorTask(0, 5, {from: sponsors[0]}),
            truffleAssert.ErrorType.REVERT
        );
        allowance = await token.allowance(sponsors[0], taskManager.address);
        assert.equal(allowance.toNumber(), 10);
        
        await token.approve(taskManager.address, 15, {from: sponsors[1]});
        tx = await taskManager.sponsorTask(0, 5, {from: sponsors[1], gas: 1000000});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 0
                && ev.sponsor == sponsors[1]
                && ev.amount == 5
        });
        allowance = await token.allowance(sponsors[1], taskManager.address);
        assert.equal(allowance.toNumber(), 10);
    });
    it("remove task", async () => {
        await truffleAssert.fails(
            taskManager.removeTask(0, {from:managers[1]}),
            truffleAssert.ErrorType.REVERT
        );
        
        tx = await taskManager.removeTask(0, {from:managers[0]})
        truffleAssert.eventEmitted(tx, "TaskRemoved", ev => {
            return ev.owner == managers[0]
                && ev.taskId == 0
        });

        tasksCount = await taskManager.getTasksCount();
        assert.equal(tasksCount.toNumber(), 0);

        sponsor_0_balance = await token.balanceOf(sponsors[0]);
        sponsor_1_balance = await token.balanceOf(sponsors[1]);

        // tokens should be returned
        assert.equal(sponsor_0_balance.toNumber(), mintAmount.toNumber());
        assert.equal(sponsor_1_balance.toNumber(), mintAmount.toNumber());
    });
    it("fund task", async () => {
        tx = await taskManager.addTask({description:"description", rewardFreelancer: 10, rewardEvaluator: 10, category: 0}, {from: managers[0]})
        truffleAssert.eventEmitted(tx, "TaskAdded", ev => {
            return ev.id == 1
                && ev.description.length > 0
                && ev.owner == managers[0]
        });

        tx = await taskManager.sponsorTask(1, 10, {from: sponsors[0]});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 1
                && ev.sponsor == sponsors[0]
                && ev.amount == 10
        });

        tx = await taskManager.sponsorTask(1, 10, {from: sponsors[1], gas: 1000000});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 1
                && ev.sponsor == sponsors[1]
                && ev.amount == 10
        });

        truffleAssert.eventEmitted(tx, "TaskFunded", ev => {
            return ev.taskId == 1
        });

    });
    it("task should not be removable after funded", async () => {
        await truffleAssert.fails(
            taskManager.removeTask(1, {from:managers[0]}),
            truffleAssert.ErrorType.REVERT
        );
    });
    it("link evaluator", async () => {
        await truffleAssert.fails(
            taskManager.linkEvaluatorToTask(1, freelancers[0], {from:managers[0]}),
            truffleAssert.ErrorType.REVERT
        );
        
        tx = await taskManager.linkEvaluatorToTask(1, evaluators[0], {from: managers[0]});
        truffleAssert.eventEmitted(tx, "TaskReady", ev => {
            return ev.taskId == 1
                && ev.evaluator == evaluators[0]
        });
    });

    it("apply for task", async () => {
        await truffleAssert.fails(
            taskManager.applyForTask(1, {from:freelancers[0]}),
            truffleAssert.ErrorType.REVERT
        ); // no allowance

        await token.approve(taskManager.address, 10, {from: freelancers[0]});

        tx = await taskManager.applyForTask(1, {from:freelancers[0]})
        truffleAssert.eventEmitted(tx, "TaskFreelancerApplied", ev => {
            return ev.taskId == 1
                && ev.freelancer == freelancers[0]
        });

        await token.approve(taskManager.address, 10, {from: freelancers[1]});
        tx = await taskManager.applyForTask(1, {from:freelancers[1]})
        truffleAssert.eventEmitted(tx, "TaskFreelancerApplied", ev => {
            return ev.taskId == 1
                && ev.freelancer == freelancers[1]
        });

        await truffleAssert.fails(
            taskManager.applyForTask(1, {from:freelancers[0]}),
            truffleAssert.ErrorType.REVERT
        );
    });

    it("hire freelancer", async () => {
        await truffleAssert.fails(
            taskManager.hireFreelancer(1, 0, {from:managers[1]}),
            truffleAssert.ErrorType.REVERT
        );

        tx = await taskManager.hireFreelancer(1, 0, {from:managers[0]})
        truffleAssert.eventEmitted(tx, "TaskFreelancerHired", ev => {
            return ev.taskId == 1
                && ev.freelancer == freelancers[0]
        });
    });

    it("finish task", async () => {
        await truffleAssert.fails(
            taskManager.finishTask(1, {from:freelancers[1]}),
            truffleAssert.ErrorType.REVERT
        );

        tx = await taskManager.finishTask(1, {from:freelancers[0]})
        truffleAssert.eventEmitted(tx, "TaskFinished", ev => {
            return ev.taskId == 1
        });
    });

    it("review task", async () => {
        await truffleAssert.fails(
            taskManager.reviewTask(1, true, {from:freelancers[0]}),
            truffleAssert.ErrorType.REVERT
        );

        tx = await taskManager.reviewTask(1, true, {from:managers[0]})
        truffleAssert.eventEmitted(tx, "TaskReviewed", ev => {
            return ev.taskId == 1
                && ev.accepted == true
        });
        
        // check event from subtransaction
        await expectEvent.inTransaction(tx.tx, memberManager, 'FreelancerReputationChanged', {
            freelancer: freelancers[0],
            increase: true
        })

        // truffleAssert.eventEmitted(tx, "FreelancerReputationChanged", ev => {
        //     return ev.freelancer == freelancers[0]
        //         && ev.increase == true
        // });

    });

});