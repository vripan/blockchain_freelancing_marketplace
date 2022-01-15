// var Marketplace = artifacts.require("./MarketplaceApp.sol");
var Token = artifacts.require("./Token.sol");
var MarketplaceUtils = artifacts.require("./MarketplaceEntities.sol");
var CategoryManager = artifacts.require("./CategoryManager.sol");
var RoleManager = artifacts.require("./RoleManager.sol");
var TaskManager = artifacts.require("./TaskManager.sol");

module.exports = async function(deployer, network, accounts) {
  const token_instance = await Token.deployed()

  await deployer.deploy(MarketplaceUtils);
  
  cm_instance = await deployer.deploy(CategoryManager);
  rm_instance = await deployer.deploy(RoleManager, cm_instance.address);

  await deployer.link(MarketplaceUtils, TaskManager);

  tm_instance = await deployer.deploy(TaskManager, cm_instance.address, rm_instance.address, token_instance.address);
  
  // await deployer.deploy(Marketplace, cm_instance.address, rm_instance.address, tm_instance.address);
};
