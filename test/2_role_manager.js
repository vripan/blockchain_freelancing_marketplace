const Marketplace = artifacts.require("MarketplaceApp")
const RoleManager = artifacts.require("RoleManager")
const CategoryManager = artifacts.require("CategoryManager");
const truffleAssert = require('truffle-assertions');

contract("RoleManager", accounts => {
    it("should have zero members on init", async () => {
        roleManager = await RoleManager.deployed();
        categoryManager = await CategoryManager.deployed();

        membersCount = await roleManager.getMembersCount();
        assert.equal(membersCount.toNumber(), 0, "invalid");

        tx = await categoryManager.addCategory("alfa");
        categoriesCount = await categoryManager.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 1, "invalid");
    });
    it("should not allow a member join multiple times", async () => {
        initalMembersCount = await roleManager.getMembersCount();

        tx = await roleManager.joinAsFreelancer(accounts[0], { name: "F1", categoryId: 0 });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[0]
        });
        
        latestMembersCount = await roleManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");

        await truffleAssert.fails(
            roleManager.joinAsFreelancer(accounts[0], { name: "F1", categoryId: 0 }),
            truffleAssert.ErrorType.REVERT
        )

        latestMembersCount = await roleManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");
    });
    it("should not allow a member join multiple roles", async () => {
        initalMembersCount = await roleManager.getMembersCount();

        tx = await roleManager.joinAsFreelancer(accounts[1], { name: "F1", categoryId: 0 });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[1]
        });
        
        latestMembersCount = await roleManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");

        await truffleAssert.fails(
            roleManager.joinAsManager(accounts[1], { name: "F1" }),
            truffleAssert.ErrorType.REVERT
        )

        latestMembersCount = await roleManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 1, "invalid");
    });
    it("should not allow a member to join with an invalid category specialization", async () => {
        initalMembersCount = await roleManager.getMembersCount();

        await truffleAssert.fails(
            roleManager.joinAsFreelancer(accounts[2], { name: "F1", categoryId: 99 }),
            truffleAssert.ErrorType.REVERT
        );

        latestMembersCount = await roleManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber(), "invalid");
    });
    it("should be able to join", async () => {
        initalMembersCount = await roleManager.getMembersCount();

        tx = await roleManager.joinAsFreelancer(accounts[3], { name: "F1", categoryId: 0 });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 1
                && ev.name == "F1"
                && ev.address_ == accounts[3]
        });

        tx = await roleManager.joinAsManager(accounts[4], { name: "F1", categoryId: 0 });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 2
                && ev.name == "F1"
                && ev.address_ == accounts[4]
        });

        tx = await roleManager.joinAsSponsor(accounts[5], { name: "F1", categoryId: 0 });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 3
                && ev.name == "F1"
                && ev.address_ == accounts[5]
        });

        tx = await roleManager.joinAsEvaluator(accounts[6], { name: "F1", categoryId: 0 });
        truffleAssert.eventEmitted(tx, "MemberJoined", ev => {
            return ev.role == 4
                && ev.name == "F1"
                && ev.address_ == accounts[6]
        });

        latestMembersCount = await roleManager.getMembersCount();
        assert.equal(latestMembersCount.toNumber(), initalMembersCount.toNumber() + 4, "invalid");
    });
});