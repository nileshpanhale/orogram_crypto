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
      port: 9001,
      network_id: "2023",
      gas : 3000000
    }

    // ropsten: {
    //   provider: function() {
    //     return new HDWalletProvider(MNEMONIC, "https://ropsten.infura.io/v3/ff51df7e52384a9f9c397159a332da53")
    //   },
    //   network_id: 3,
    //   gas: 3000000
    //   //make sure this gas allocation isn't over 4M, which is the max
    // }
  }
};