const CategoryManager = artifacts.require("CategoryManager")
const truffleAssert = require('truffle-assertions');

contract("CategoryManager", accounts => {
    it("should be able to add categories", async () => {
        categoryManager =  await CategoryManager.deployed()

        checkAddCategory = async function (categoryManager, name, expectedId) {
            tx = await categoryManager.addCategory(name);
            truffleAssert.eventEmitted(tx, 'CategoryAdded', ev => ev.id == expectedId && ev.name == name);
        } 

        categoriesCount = await categoryManager.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 0, "invalid init");

        await checkAddCategory(categoryManager, "alfa", 0);
        await checkAddCategory(categoryManager, "beta", 1);
        await checkAddCategory(categoryManager, "teta", 2);

        await truffleAssert.fails(
            categoryManager.addCategory("abc", { from: accounts[1] }),
            truffleAssert.ErrorType.REVERT
        )

        categoriesCount = await categoryManager.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 3, "invalid init");

        assert.equal(await categoryManager.getCategoryName.call(0), "alfa", "invalid name");
        assert.equal(await categoryManager.getCategoryName.call(1), "beta", "invalid name");
        assert.equal(await categoryManager.getCategoryName.call(2), "teta", "invalid name");

        assert.equal(await categoryManager.isValidCategoryId.call(0), true, "invalid");
        assert.equal(await categoryManager.isValidCategoryId.call(1), true, "invalid");
        assert.equal(await categoryManager.isValidCategoryId.call(2), true, "invalid");
                
        assert.equal(await categoryManager.isValidCategoryId.call(3), false, "invalid");

        categoriesCount = await categoryManager.getCategoriesCount();
        assert.equal(categoriesCount.toNumber(), 3, "invalid init");
    });
});