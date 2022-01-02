const Marketplace = artifacts.require("MarketplaceApp")
const Token = artifacts.require("Token")
const truffleAssert = require('truffle-assertions');

freelancers = []
sponsors = []
managers = []
evaluators = []

contract("CategoryManager", accounts => {
    it("init market with categories", async () => {
        marketplace = await Marketplace.deployed();

        await Promise.all([
            marketplace.addCategory("c1"),
            marketplace.addCategory("c2"),
            marketplace.addCategory("c3"),
        ]);

        categoriesCount = await marketplace.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 3, "invalid");
    });
    it("init market with members", async () => {
        marketplace = await Marketplace.deployed();
        token = await Token.deployed();

        entity_name = "entity"
        chunk_size = accounts.length / 4;
        for(i = 0; i<accounts.length; i++)
        {
            token.mint({from: accounts[i]});
            
            if(i >= 0 && i < chunk_size )
            {
                freelancers.push(accounts[i]);
                await marketplace.joinAsFreelancer({name:entity_name, categoryId:0}, {from:accounts[i]})
            }
            else if(i >= chunk_size && i < chunk_size * 2)
            {
                sponsors.push(accounts[i]);
                await marketplace.joinAsSponsor({name:entity_name}, {from:accounts[i]})
            }
            else if(i >= chunk_size * 2 && i < chunk_size * 3)
            {
                managers.push(accounts[i]);
                await marketplace.joinAsManager({name:entity_name}, {from:accounts[i]})
            }
            else if(i >= chunk_size * 3&& i < chunk_size * 4)
            {
                evaluators.push(accounts[i]);
                await marketplace.joinAsEvaluator({name:entity_name, categoryId:0}, {from:accounts[i]})
            }
        }

        membersCount = await marketplace.getMembersCount();
        assert.equal(membersCount.toNumber(), accounts.length, "invalid");
    });
    it("create task", async () => {
        marketplace = await Marketplace.deployed();
        token = await Token.deployed();

        tasksCount = await marketplace.getTasksCount();
        assert.equal(tasksCount.toNumber(), 0);

        tx = await marketplace.addTask({description:"description", rewardFreelancer: 10, rewardEvaluator: 10, category: 0}, {from: managers[0]})
        truffleAssert.eventEmitted(tx, "TaskAdded", ev => {
            return ev.id == 0
                && ev.description.length > 0
                && ev.owner == managers[0]
        });

        tasksCount = await marketplace.getTasksCount();
        assert.equal(tasksCount.toNumber(), 1);
    });
    it("partially sponsor task", async () => {
        marketplace = await Marketplace.deployed();
        token = await Token.deployed();

        mintAmount = await token.mintAmount();

        // no token allowance
        await truffleAssert.fails(
            marketplace.sponsorTask(0, 10, {from: sponsors[0]}),
            truffleAssert.ErrorType.REVERT
        );

        await token.approve(marketplace.address, 20, {from: sponsors[0]});
        tx = await marketplace.sponsorTask(0, 5, {from: sponsors[0]});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 0
                && ev.sponsor == sponsors[0]
                && ev.amount == 5
        });
        allowance = await token.allowance(sponsors[0], marketplace.address);
        assert.equal(allowance.toNumber(), 15);

        // widraw sponsorship
        tx = await marketplace.withdrawSponsorship(0, {from: sponsors[0]});
        truffleAssert.eventEmitted(tx, "SponsorshipWidrawed", ev => {
            return ev.taskId == 0
                && ev.sponsor == sponsors[0]
                && ev.amount == 5
        });

        sponsor_0_balance = await token.balanceOf(sponsors[0]);
        assert.equal(sponsor_0_balance.toNumber(), mintAmount.toNumber());

        // sponsor back
        tx = await marketplace.sponsorTask(0, 5, {from: sponsors[0]});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 0
                && ev.sponsor == sponsors[0]
                && ev.amount == 5
        });
        allowance = await token.allowance(sponsors[0], marketplace.address);
        assert.equal(allowance.toNumber(), 10);

        // sponsor task multiple times
        await truffleAssert.fails(
            marketplace.sponsorTask(0, 5, {from: sponsors[0]}),
            truffleAssert.ErrorType.REVERT
        );
        allowance = await token.allowance(sponsors[0], marketplace.address);
        assert.equal(allowance.toNumber(), 10);
        
        await token.approve(marketplace.address, 15, {from: sponsors[1]});
        tx = await marketplace.sponsorTask(0, 5, {from: sponsors[1], gas: 1000000});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 0
                && ev.sponsor == sponsors[1]
                && ev.amount == 5
        });
        allowance = await token.allowance(sponsors[1], marketplace.address);
        assert.equal(allowance.toNumber(), 10);
    });
    it("remove task", async () => {
        marketplace = await Marketplace.deployed();
        token = await Token.deployed();

        await truffleAssert.fails(
            marketplace.removeTask(0, {from:managers[1]}),
            truffleAssert.ErrorType.REVERT
        );
        
        tx = await marketplace.removeTask(0, {from:managers[0]})
        truffleAssert.eventEmitted(tx, "TaskRemoved", ev => {
            return ev.owner == managers[0]
                && ev.taskId == 0
        });

        tasksCount = await marketplace.getTasksCount();
        assert.equal(tasksCount.toNumber(), 0);

        sponsor_0_balance = await token.balanceOf(sponsors[0]);
        sponsor_1_balance = await token.balanceOf(sponsors[1]);

        // tokens should be returned
        assert.equal(sponsor_0_balance.toNumber(), mintAmount.toNumber());
        assert.equal(sponsor_1_balance.toNumber(), mintAmount.toNumber());
    });
    it("fund task", async () => {
        marketplace = await Marketplace.deployed();
        token = await Token.deployed();

        tx = await marketplace.addTask({description:"description", rewardFreelancer: 10, rewardEvaluator: 10, category: 0}, {from: managers[0]})
        truffleAssert.eventEmitted(tx, "TaskAdded", ev => {
            return ev.id == 1
                && ev.description.length > 0
                && ev.owner == managers[0]
        });

        tx = await marketplace.sponsorTask(1, 10, {from: sponsors[0]});
        truffleAssert.eventEmitted(tx, "TaskSponsored", ev => {
            return ev.taskId == 1
                && ev.sponsor == sponsors[0]
                && ev.amount == 10
        });

        tx = await marketplace.sponsorTask(1, 10, {from: sponsors[1], gas: 1000000});
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
        marketplace = await Marketplace.deployed();
        token = await Token.deployed();

        await truffleAssert.fails(
            marketplace.removeTask(1, {from:managers[0]}),
            truffleAssert.ErrorType.REVERT
        );
    });
    it("link evaluator", async () => {
        marketplace = await Marketplace.deployed();
        token = await Token.deployed();

        await truffleAssert.fails(
            marketplace.linkEvaluatorToTask(1, freelancers[0], {from:managers[0]}),
            truffleAssert.ErrorType.REVERT
        );
        
        tx = await marketplace.linkEvaluatorToTask(1, evaluators[0], {from: managers[0]});
        truffleAssert.eventEmitted(tx, "TaskReady", ev => {
            return ev.taskId == 1
                && ev.evaluator == evaluators[1]
        });

        await truffleAssert.fails(
            marketplace.checkHireTimeout(1, {from:freelancers[0]}),
            truffleAssert.ErrorType.REVERT
        );
    });

    // todo: check hireTimeout with actual timeout
});