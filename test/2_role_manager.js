const Marketplace = artifacts.require("MarketplaceApp")
const truffleAssert = require('truffle-assertions');
return;
contract("RoleManager", accounts => {
    it("should have zero members on init", async () => {
        marketplace = await Marketplace.deployed();

        membersCount = await marketplace.getMembersCount();
        assert.equal(membersCount.toNumber(), 0, "invalid");

        tx = await marketplace.addCategory("alfa");
        categoriesCount = await marketplace.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 1, "invalid");
    });
    it("should not allow a member join multiple times", async () => {
        marketplace = await Marketplace.deployed();

        initalMembersCount = await marketplace.getMembersCount();

        tx = await marketplace.joinAsFreelancer({ name: "F1", categoryId: 0 }, {from: accounts[0]});
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[0]
        });
        
        latestMembersCount = await marketplace.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");

        await truffleAssert.fails(
            marketplace.joinAsFreelancer({ name: "F1", categoryId: 0 }, {from: accounts[0]}),
            truffleAssert.ErrorType.REVERT
        )

        latestMembersCount = await marketplace.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");
    });
    it("should not allow a member join multiple roles", async () => {
        marketplace = await Marketplace.deployed();

        initalMembersCount = await marketplace.getMembersCount();

        tx = await marketplace.joinAsFreelancer({ name: "F1", categoryId: 0 }, {from: accounts[1]});
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[1]
        });
        
        latestMembersCount = await marketplace.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");

        await truffleAssert.fails(
            marketplace.joinAsManager({ name: "F1" }, {from: accounts[1]}),
            truffleAssert.ErrorType.REVERT
        )

        latestMembersCount = await marketplace.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");
    });
    it("should not allow a member to join with an invalid category specialization", async () => {
        marketplace = await Marketplace.deployed();

        initalMembersCount = await marketplace.getMembersCount();

        await truffleAssert.fails(
            marketplace.joinAsFreelancer({ name: "F1", categoryId: 99 }, {from: accounts[2]}),
            truffleAssert.ErrorType.REVERT
        );

        latestMembersCount = await marketplace.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber(), "invalid");
    });
    it("should be able to join", async () => {
        marketplace = await Marketplace.deployed();

        initalMembersCount = await marketplace.getMembersCount();

        tx = await marketplace.joinAsFreelancer({ name: "F1", categoryId: 0 }, {from: accounts[3]});
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[3]
        });

        tx = await marketplace.joinAsManager({ name: "F1", categoryId: 0 }, {from: accounts[4]});
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 2
                && ev.name == "F1"
                && ev.address_ == accounts[4]
        });

        tx = await marketplace.joinAsSponsor({ name: "F1", categoryId: 0 }, {from: accounts[5]});
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 3
                && ev.name == "F1"
                && ev.address_ == accounts[5]
        });

        tx = await marketplace.joinAsEvaluator({ name: "F1", categoryId: 0 }, {from: accounts[6]});
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 4
                && ev.name == "F1"
                && ev.address_ == accounts[6]
        });

        latestMembersCount = await marketplace.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 4, "invalid");
    });
});