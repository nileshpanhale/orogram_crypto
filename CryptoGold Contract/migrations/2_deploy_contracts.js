var RoboHashToken = artifacts.require("./CryptoGold.sol");

module.exports = function(deployer) {
	deployer.deploy(RoboHashToken);	
};