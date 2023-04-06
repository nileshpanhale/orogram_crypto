var mapNFT = artifacts.require("./landNFT.sol");

module.exports = function (deployer) {
    deployer.deploy(mapNFT);
};
