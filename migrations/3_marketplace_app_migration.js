var Marketplace = artifacts.require("./MarketplaceApp.sol");
var Token = artifacts.require("./Token.sol");

module.exports = async function(deployer, network, accounts) {
  const token_instance = await Token.deployed()
  await deployer.deploy(Marketplace, token_instance.address);
};
