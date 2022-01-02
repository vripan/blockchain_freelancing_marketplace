const MarketplaceApp = artifacts.require("MarketplaceApp")
const Token = artifacts.require("Token")

module.exports = async function() {
    mk = await MarketplaceApp.deployed()
    tk = await Token.deployed()

    await mk.addCategory("sad")

    await mk.getCategoriesCount()

    await mk.joinAsFreelancer({name:"sad", categoryId: 0})
    await mk.joinAsManager({name:"sad", categoryId: 0}, {from:accounts[1]})
    await mk.joinAsSponsor({name:"sad", categoryId: 0}, {from:accounts[2]})

    await mk.addTask({description:"description", rewardFreelancer: 10, rewardEvaluator: 10, category: 0}, {from: accounts[1]})

    tk.mint({from: accounts[2]})

// await tk.approve(mk.address, 50, {from: accounts[2]})

// tx = await mk.sponsorTask(0, 10, {from: accounts[2]});
}

await mk.joinAsSponsor({name:"sad", categoryId: 0}, {from:accounts[3]})
tk.mint({from: accounts[3]})

await tk.approve(mk.address, 50, {from: accounts[3]})