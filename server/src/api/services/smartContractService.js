var Web3 = require('web3');
// var abi = require('./abi.json')
const Tx = require('ethereumjs-tx').Transaction;
const Common = require('@ethereumjs/common').default;

const provider = new Web3.providers.HttpProvider("http://127.0.0.1:9001");
// const provider = new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/0eefca2527d44b9589a544d7f403b067");
var web3 = new Web3(provider);

var contractAddress = '0x4eb7581059a4D7460EDC01354047817b28757b4e';
const abi = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_acceptor",
				"type": "address"
			}
		],
		"name": "acceptedTrade",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_generatedId",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "_validity",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "_tradeMsg",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "_imghash",
				"type": "string"
			}
		],
		"name": "createContact",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_creator",
				"type": "address"
			}
		],
		"name": "createdTrade",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "transactionId",
				"type": "uint256"
			}
		],
		"name": "creatorSecondSign",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "transactionId",
				"type": "uint256"
			}
		],
		"name": "getContract",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "enum CryptoGold.Action",
				"name": "",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "isOwner",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "openTrades",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_transactionId",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "_value",
				"type": "bool"
			}
		],
		"name": "responderSign",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "transactionId",
				"type": "uint256"
			}
		],
		"name": "setCancel",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "transactionId",
				"type": "uint256"
			}
		],
		"name": "setConfirm",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "transactionId",
				"type": "uint256"
			}
		],
		"name": "setDispute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_transactionId",
				"type": "uint256"
			}
		],
		"name": "setPaid",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "transactionId",
				"type": "uint256"
			},
			{
				"internalType": "enum CryptoGold.Action",
				"name": "actionStatus",
				"type": "uint8"
			}
		],
		"name": "setStatusByAdmin",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];
var accounts = web3.eth.accounts;
var contractInstance = new web3.eth.Contract(abi, contractAddress);
const common = Common.custom({ chainId: 2023 });

var Action = ["NEW", "CONFIRM", "PENDING", "PAID", "CANCEL", "DISPUTE", "ACCEPT"];

//create contract--------------
async function createContact(id, date, contractText, publicKey, privateKey, imageUrl) {

	let nonce = await web3.eth.getTransactionCount(publicKey, 'pending');
    const contractFunction = contractInstance.methods.createContact(id, date, contractText, imageUrl).encodeABI();
	const NetworkId = await web3.eth.net.getId();

    /**
    * Raw_transaction instance to specify all parameters for ethereumjs-tx Transation
    */
    const rawTx = {
        "from": publicKey,
        "to": contractAddress,
        "data": contractFunction,
        "nonce": nonce,
        "value": "0x00000000000000",
		"gasLimit": web3.utils.toHex(2100000),
        "gasPrice": 00,
        "chainId": NetworkId
    };

    /**
     * @dev initiate transaction with Raw_trasansaction instance for ethereumjs-tx Transaction
     */
    let transaction = new Tx(rawTx, { common });

    /**
     * @dev sign the transaction with private key to change blockchain status
     */
	const pvt = Buffer.from(privateKey, 'hex');
    transaction.sign(pvt);

    /**
     * @dev send the signed transaction to smart contract
     */
	return web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'));
}

//Respond contract--------------
async function responderSign(id, status, publicKey, privateKey) {
    // return new Promise((resolve,reject) => { 
    // contractInstance.methods.responderSign(id, status);

	const buffer = Buffer.from(privateKey, 'hex');
    const contractFunction = contractInstance.methods.responderSign(id, status).encodeABI();
	let nonce = await web3.eth.getTransactionCount(publicKey);
    const NetworkId = await web3.eth.net.getId();

    const txParams = {
        "gasPrice": 00,
        "gasLimit": web3.utils.toHex(2100000),
        "to": contractAddress,
        "data": contractFunction,
        "from": publicKey,
        "nonce": nonce,
        "value": "0x00000000000000",
        "chainId": NetworkId
    };

    const tx = new Tx(txParams, { common });

    tx.sign(buffer);

    return web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'));
    // web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'), (err, hash) => {
    //     if (err) {
    //         console.log(err);
    //         return "Failed";
    //     } else {
    //         console.log("Transaction successfull : ", hash);
    //         return "Success";
    //     }
    // });
    // })
}

//CreatorSecondSign Respond contract--------------
async function creatorSecondSign(id, status, publicKey, privateKey) {
    // return new Promise((resolve,reject) => { 
    // contractInstance.methods.creatorSecondSign(id);
    // })

	const buffer = Buffer.from(privateKey, 'hex');
    const contractFunction = contractInstance.methods.creatorSecondSign(id).encodeABI();
	let nonce = await web3.eth.getTransactionCount(publicKey);
    const NetworkId = await web3.eth.net.getId();

    const txParams = {
        "gasPrice": 00,
        "gasLimit": web3.utils.toHex(2100000),
        "to": contractAddress,
        "data": contractFunction,
        "from": publicKey,
        "nonce": nonce,
        "value": "0x00000000000000",
        "chainId": NetworkId
    };

    const tx = new Tx(txParams, { common });

    tx.sign(buffer);

    return web3.eth.sendSignedTransaction('0x' + tx.serialize().toString('hex'));
}


//setConfirm contract--------------
function setConfirm(id) {
    // return new Promise((resolve,reject) => { 
    contractInstance.methods.setConfirm(id);
    // })
}

//setCancel contract--------------
function setCancel(id) {
    // return new Promise((resolve,reject) => { 
    contractInstance.methods.setCancel(id);
    // })
}

//setPaid contract--------------
function setPaid(id) {
    // return new Promise((resolve,reject) => { 
    contractInstance.methods.setPaid(id);
    // })
}

//setDispute contract--------------
function setDispute(id) {
    // return new Promise((resolve,reject) => { 
    contractInstance.methods.setDispute(id);
    // })
}

//setStatusByAdmin contract--------------
function setStatusByAdmin(id, status) {
    // return new Promise((resolve,reject) => { 
    console.log("In admin", status);
    console.log("In admin action", Action[status]);
    contractInstance.setStatusByAdmin(id, status);
    // })
}
//acceptedTrade contract--------------
function acceptedTrade(address) {
    // return new Promise((resolve,reject) => { 
    return contractInstance.acceptedTrade(address);
    // })
}

//openTrades Return array of contract ids ----------------------------
function openTrades() {
    // return new Promise((resolve,reject) => { 
    return contractInstance.openTrades();
    // })
}

//Return contract details by id --------------
function getContract(id) {
    // return new Promise((resolve,reject) => {
    var data = contractInstance.getContract(id);

    var contractData = {
        "creator": data[0],
        "responder": data[1],
        "creatorFirstSign": data[2],
        "creatorSecondSign": data[3],
        "responderSign": data[4],
        "contractText": data[5],
        "contractValidity": data[6].toFixed(),
        "status": Action[data[7].toFixed()]
    }

    return contractData;

    // })


}

module.exports = { createContact, responderSign, creatorSecondSign, setConfirm, setCancel, setPaid, setDispute, setStatusByAdmin, acceptedTrade, openTrades, getContract }
