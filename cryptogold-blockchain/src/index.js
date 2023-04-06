const express = require('express');
const mongoose = require('mongoose');
const Web3 = require('web3');
const ETx = require('ethereumjs-tx').Transaction;
// const Common = require('ethereumjs-tx').default;
const Common = require('@ethereumjs/common').default;
const web3 = new Web3(new Web3.providers.HttpProvider('http://127.0.0.1:9001'));

/**
 * @dev deployed contract address and ABI on network
 */
const contractAddr = '0xf7F33c0f409a18737d7B91d343bbFF5a85669538';
const contractABI = [
  {
    "inputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Approval",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "Transfer",
    "type": "event"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "supply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "_account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      }
    ],
    "name": "allowance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "approve",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "from",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "value",
        "type": "uint256"
      }
    ],
    "name": "transferFrom",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "addedValue",
        "type": "uint256"
      }
    ],
    "name": "increaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {
        "internalType": "address",
        "name": "spender",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "subtractedValue",
        "type": "uint256"
      }
    ],
    "name": "decreaseAllowance",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

/**
 * @dev account address and private key from which we deploy smart contract
 */
const owner = "0xE92029AD77CcA3E58A85491c496756fe25924f28";

/**
 * @dev deployed contract instance
 */
// const contract = new web3.eth.Contract(contractABI, contractAddr, { from: owner });
const contract = new web3.eth.Contract(contractABI, contractAddr, { from: owner });
const common = Common.custom({ chainId: 2023 });

/**
 * @returns Token name
 */
async function name() {
    const result = await contract.methods.name().call();
    console.log("Name of Token : " + result);
    return result;
};

/**
 *
 * @returns Token symbol
 */
async function symbol() {
    const result = await contract.methods.symbol().call();
    console.log("Symbol of Token : " + result);
    return result;
};

/**
* @returns Total count of minted tokens
 */
async function totalSupply() {
    let result = await contract.methods.totalSupply().call();
    console.log("Total Supply of token ", result);
    return result;
};

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
async function mint(receiver, amt) {
    
    let nonce = await web3.eth.getTransactionCount(owner, 'pending');
    const amount = web3.utils.toHex(amt);
    const mintFunction = contract.methods.mint(receiver, amount).encodeABI();
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
module.exports = { name, symbol, totalSupply, mint, Transfer, checkBal };