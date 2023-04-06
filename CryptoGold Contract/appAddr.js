var Web3 = require('web3');
var abi  = require('./abi.json')
const Tx = require('ethereumjs-tx');
const wallet = require('ethereumjs-wallet');


const myWallet = wallet.generate();

console.log(`Address: ${myWallet.getAddressString()}`);
console.log(`Private Key: ${myWallet.getPrivateKeyString()}`)

