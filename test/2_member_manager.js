const MemberManager = artifacts.require("MemberManager")
const CategoryManager = artifacts.require("CategoryManager");
const truffleAssert = require('truffle-assertions');

contract("MemberManager", accounts => {
    it("should have zero members on init", async () => {
        memberManager = await MemberManager.deployed();
        categoryManager = await CategoryManager.deployed();

        membersCount = await memberManager.getMembersCount();
        assert.equal(membersCount.toNumber(), 0, "invalid");

        tx = await categoryManager.addCategory("alfa");
        categoriesCount = await categoryManager.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 1, "invalid");
    });
    it("should not allow a member join multiple times", async () => {
        initalMembersCount = await memberManager.getMembersCount();

        tx = await memberManager.joinAsFreelancer({ name: "F1", categoryId: 0 }, { from: accounts[0] });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[0]
        });

        latestMembersCount = await memberManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");

        await truffleAssert.fails(
            memberManager.joinAsFreelancer({ name: "F1", categoryId: 0 }, {from:accounts[0]}),
            truffleAssert.ErrorType.REVERT
        )

        latestMembersCount = await memberManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");
    });
    it("should not allow a member join multiple roles", async () => {
        initalMembersCount = await memberManager.getMembersCount();

        tx = await memberManager.joinAsFreelancer({ name: "F1", categoryId: 0 }, { from: accounts[1] });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[1]
        });

        latestMembersCount = await memberManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");

        await truffleAssert.fails(
            memberManager.joinAsManager({ name: "F1" }, { from: accounts[1] }),
            truffleAssert.ErrorType.REVERT
        )

        latestMembersCount = await memberManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");
    });
    it("should not allow a member to join with an invalid category specialization", async () => {
        initalMembersCount = await memberManager.getMembersCount();

        await truffleAssert.fails(
            memberManager.joinAsFreelancer({ name: "F1", categoryId: 99 }, { from: accounts[2] }),
            truffleAssert.ErrorType.REVERT
        );

        latestMembersCount = await memberManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber(), "invalid");
    });
    it("should be able to join", async () => {
        initalMembersCount = await memberManager.getMembersCount();

        tx = await memberManager.joinAsFreelancer({ name: "F1", categoryId: 0 }, { from: accounts[3] });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[3]
        });

        tx = await memberManager.joinAsManager({ name: "F1", categoryId: 0 }, { from: accounts[4] });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 2
                && ev.name == "F1"
                && ev.address_ == accounts[4]
        });

        tx = await memberManager.joinAsSponsor({ name: "F1", categoryId: 0 }, { from: accounts[5] });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 3
                && ev.name == "F1"
                && ev.address_ == accounts[5]
        });

        tx = await memberManager.joinAsEvaluator({ name: "F1", categoryId: 0 }, { from: accounts[6] });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 4
                && ev.name == "F1"
                && ev.address_ == accounts[6]
        });

        latestMembersCount = await memberManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 4, "invalid");
    });
});