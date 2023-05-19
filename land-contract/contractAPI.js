const express = require('express');
const mongoose = require('mongoose');
const Web3 = require('web3');
const ETx = require('ethereumjs-tx').Transaction;
const Common = require('@ethereumjs/common').default;
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9001'));

/**
 * @dev deployed contract address and ABI on network
 */
const contractAddr = '';
const contractABI = [];

/**
 * @dev account address and private key from which we deploy smart contract
 */
const owner = "0xaDC085331b072C682007b7db1916Fd2b15458B4C";

/**
 * @dev deployed contract instance
 */
const contract = new web3.eth.Contract(contractABI, contractAddr, { from: owner });
const common = Common.custom({ chainId: 2023 });


/**
 * @dev returns Account authority as a minter
 */

async function checkBal(account) {

  let bal = await contract.methods.balanceOf(account).call();
  bal = Math.trunc(bal);
  bal = bal / (10 ** 8);
  return bal;

};

/**
 * Token mint function call
 */
async function mintNFT(receiver, mongoID) {
    
    let nonce = await web3.eth.getTransactionCount(owner, 'pending');
    const mintFunction = contract.methods.safeMint(receiver, mongoID).encodeABI();
    const NetworkId = await web3.eth.net.getId();

    /**
    * Raw_transaction instance to specify all parameters for ethereumjs-tx Transation
    */
    const rawTx = {
        "from": owner,
        "to": contractAddr,
        "data": mintFunction,
        "nonce": nonce,
        "value": "0x00000000000000",
        "gasLimit": web3.utils.toHex(210000),
        "gasPrice": 00,
        "chainId": NetworkId
    };

    /**
     * @dev initiate transaction with Raw_trasansaction instance for ethereumjs-tx Transaction
     */
    let transaction = new ETx(rawTx, { common });

    /**
     * @dev sign the transaction with private key to change blockchain status
     */
    transaction.sign(pvt);

    /**
     * @dev send the signed transaction to smart contract
     */
    web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'), (err, hash) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Mint Transaction Hash : " + hash);
            console.log("=========================");
            console.log("Token minting successful.");
            return hash;
        }
    });
};

/**
 * @dev Token transfer function call returns transaction hash
 * @param sender is the transaction initiator who send tokens to receiver
 * @param pvtKey is sender accounts private key used to sign the transaction initiated by sender
 * @param receiver is the token receivers public key
 * @param amt is the token value to be sent to receiver
 * @returns successful transaction hash or an error if any
 */
async function Transfer(sender, pvtKey, receiver, amt) {

    let nonce = await web3.eth.getTransactionCount(sender, 'pending');
    amt = Math.trunc(amt * 10 ** 8);
    const amount = web3.utils.toHex(amt);
    const transferFunction = contract.methods.transfer(receiver, amount).encodeABI();
    const NetworkId = await web3.eth.net.getId();
    
    /**
    * Raw_transaction instance to specify all parameters for ethereumjs-tx Transation
    */
    const rawTx = {
        "from": sender,
        "to": contractAddr,
        "data": transferFunction,
        "nonce": nonce,
        "value": "0x00000000000000",
        "gasLimit": web3.utils.toHex(210000),
        "gasPrice": 00,
        "chainId": NetworkId
    };

    /**
     * @dev initiate transaction with Raw_trasansaction instance for ethereumjs-tx Transaction
     */
    let transaction = new ETx(rawTx, { common });

    /**
     * @dev sign the transaction with private key to change blockchain status
     */
    const pvt = Buffer.from(pvtKey, 'hex');
    transaction.sign(pvt);

    /**
    * @dev send the signed transaction to smart contract
    */
    return await web3.eth.sendSignedTransaction("0x" + transaction.serialize().toString('hex'));
  
};

/**
 * exports all functions
 */
module.exports = { mintNFT, Transfer, checkBal };