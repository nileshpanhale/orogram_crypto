// module.exports = {
//   // See <http://truffleframework.com/docs/advanced/configuration>
//   // to customize your Truffle configuration!
// };


// var HDWalletProvider = require("truffle-hdwallet-provider");
// const MNEMONIC = 'gospel load cover helmet betray crop pelican later close silly interest tuna';

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777",
      gas: 3000000
    }
  },
  compilers: {
    solc: {
      version: "^0.4.22",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200
        },
      }
    }
  }
};