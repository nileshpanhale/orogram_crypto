// require('dotenv').config({path: '.env.local'});
// const Web3 = require("web3");
// const web3 = new Web3();
// const WalletProvider = require("truffle-wallet-provider");
// const Wallet = require('ethereumjs-wallet');

// module.exports = {
// 	networks: {
// 		ropsten: {
// 		    provider: function(){
// 				console.log(process.env["ROPSTEN_PRIVATE_KEY"])
// 				var ropstenPrivateKey = new Buffer(process.env["ROPSTEN_PRIVATE_KEY"], "hex")
// 				console.log('Converted')
// 				var ropstenWallet ='6c37136665f8C80848e6b0Dd0b320974Cc80f777';
// 				console.log(ropstenWallet)
// 		    	return new WalletProvider(ropstenWallet, "https://ropsten.infura.io/v3/d251bbea9b4e47ebb10ea863b6d8fdd3");
// 		    },
// 		    gas: 4600000,
// 	      	gasPrice: web3.toWei("20", "gwei"),
// 		    network_id: '3',
// 		}
// 	}
// };


// var HDWalletProvider = require("truffle-hdwallet-provider");
// const MNEMONIC = 'gospel load cover helmet betray crop pelican later close silly interest tuna';

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "2022"
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