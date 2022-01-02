const Marketplace = artifacts.require("MarketplaceApp")
const truffleAssert = require('truffle-assertions');
return;
contract("CategoryManager", accounts => {
    it("should be able to add categories", async () => {
        marketplace = await Marketplace.deployed();

        checkAddCategory = async function (marketplace, name, expectedId) {
            tx = await marketplace.addCategory(name);
            truffleAssert.eventEmitted(tx, 'CategoryAdded', ev => ev.id == expectedId && ev.name == name);
        }

        categoriesCount = await marketplace.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 0, "invalid init");

        await checkAddCategory(marketplace, "alfa", 0);
        await checkAddCategory(marketplace, "beta", 1);
        await checkAddCategory(marketplace, "teta", 2);

        await truffleAssert.fails(
            marketplace.addCategory("abc", { from: accounts[1] }),
            truffleAssert.ErrorType.REVERT
        )

        categoriesCount = await marketplace.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 3, "invalid init");

        assert.equal(await marketplace.getCategoryName.call(0), "alfa", "invalid name");
        assert.equal(await marketplace.getCategoryName.call(1), "beta", "invalid name");
        assert.equal(await marketplace.getCategoryName.call(2), "teta", "invalid name");

        assert.equal(await marketplace.isValidCategoryId.call(0), true, "invalid");
        assert.equal(await marketplace.isValidCategoryId.call(1), true, "invalid");
        assert.equal(await marketplace.isValidCategoryId.call(2), true, "invalid");
                
        assert.equal(await marketplace.isValidCategoryId.call(3), false, "invalid");

        categoriesCount = await marketplace.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 3, "invalid init");
    });
});