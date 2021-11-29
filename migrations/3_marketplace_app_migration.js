var Marketplace = artifacts.require("./MarketplaceApp.sol");
var Token = artifacts.require("./Token.sol");

module.exports = async function(deployer, network, accounts) {
  // Token.deployed().then((instance) => {
  //   console.log("POLLLL");
  //   deployer.deploy(Marketplace, instance.address);
  // });
  const token_instance = await Token.deployed()
  await deployer.deploy(Marketplace, token_instance.address);
};
