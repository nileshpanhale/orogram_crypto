const landNFT = artifacts.require("landNFT");

module.exports = function (deployer) {
  deployer.deploy(landNFT);
};