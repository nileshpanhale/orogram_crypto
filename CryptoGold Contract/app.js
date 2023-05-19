var Web3 = require('web3');
var abi  = require('./abi.json')
const Tx = require('ethereumjs-tx');
const provider = new Web3.providers.HttpProvider("http://127.0.0.1:9001");
// const provider = new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/0eefca2527d44b9589a544d7f403b067");
var web3 = new Web3(provider);

var contractAddress = '0x4eb7581059a4D7460EDC01354047817b28757b4e';
// var publicKey = '0xbE7211f60C90Ea2F5ae6870644B23F8548702967';
// let privateKey = new Buffer('47b9445215d6985521d3c9f1ab68bb3c6acc3722b044e7f95503fa9dbca8e6cb', 'hex')

var CryptoGoldContract = web3.eth.contract(abi);
var accounts = web3.eth.accounts;
var owner = accounts[0];
var contractInstance = CryptoGoldContract.at(contractAddress);

var Action=["NEW","CONFIRM","PENDING", "PAID", "CANCEL", "DISPUTE", "ACCEPT"];

//create contract--------------
async function createContact(id, date, contractText, publicKey, privateKey, imageUrl) {

	let nonce = await web3.eth.getTransactionCount(publicKey, 'pending');
    const contractFunction = contractInstance.methods.createContact(id, date, contractText, " ").encodeABI();
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
		"gas" : 00,
        "gasLimit": web3.utils.toHex(210000),
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
    web3.eth.sendSignedTransaction('0x' + transaction.serialize().toString('hex'), (err, hash) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Contract Transaction Hash : " + hash);
            console.log("=========================");
            console.log("Contract creation successful.");
            return hash;
        }
    });

    // })
}

//Respond contract--------------
function responderSign(id,status){
    // return new Promise((resolve,reject) => { 
       contractInstance.responderSign(id,status);
    // })
}

//CreatorSecondSign Respond contract--------------
function creatorSecondSign(id){
    // return new Promise((resolve,reject) => { 
       contractInstance.creatorSecondSign(id,status);
    // })
}


//setConfirm contract--------------
function setConfirm(id){
    // return new Promise((resolve,reject) => { 
       contractInstance.setConfirm(id);
    // })
}

//setCancel contract--------------
function setCancel(id){
    // return new Promise((resolve,reject) => { 
       contractInstance.setCancel(id);
    // })
}

//setPaid contract--------------
function setPaid(id){
    // return new Promise((resolve,reject) => { 
       contractInstance.setPaid(id);
    // })
}

//setDispute contract--------------
function setDispute(id){
    // return new Promise((resolve,reject) => { 
       contractInstance.setDispute(id);
    // })
}

//setStatusByAdmin contract--------------
function setStatusByAdmin(id,status){
    // return new Promise((resolve,reject) => { 
        console.log("In admin",status);
        console.log("In admin action",Action[status]);
        contractInstance.setStatusByAdmin(id,status);
    // })
}
//acceptedTrade contract--------------
function acceptedTrade(address){
    // return new Promise((resolve,reject) => { 
        return contractInstance.acceptedTrade(address);
    // })
}

//openTrades Return array of contract ids ----------------------------
function openTrades(){
    // return new Promise((resolve,reject) => { 
        return contractInstance.openTrades();
    // })
}

//Return contract details by id --------------
function getContract(id){
// return new Promise((resolve,reject) => {
    var data = contractInstance.getContract(id);

    var contractData = {
        "creator":data[0],
        "responder":data[1],
        "creatorFirstSign":data[2],
        "creatorSecondSign":data[3],
        "responderSign":data[4],
        "contractText":data[5],
        "contractValidity":data[6].toFixed(),
        "status":Action[data[7].toFixed()]
    }

    return contractData;

   // })
       

}
