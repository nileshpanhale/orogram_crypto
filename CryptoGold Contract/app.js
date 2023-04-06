var Web3 = require('web3');
var abi = require('./abi.json')
const Tx = require('ethereumjs-tx');
const provider = new Web3.providers.HttpProvider("http://127.0.0.1:8545");
var web3 = new Web3(provider);

var contractAddress = '0x3610B9faBBD8a8ad477aDb797a50eBf8C03E0BFB';
var CryptoGoldContract = web3.eth.contract(abi);
var accounts = web3.eth.accounts;
var owner = accounts[0];
var contractInstance = CryptoGoldContract.at(contractAddress);

var Action = ["NEW", "CONFIRM", "PENDING", "PAID", "CANCEL", "DISPUTE", "ACCEPT"];

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
        "gas": 00,
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
function responderSign(id, status) {
    contractInstance.responderSign(id, status);
}

//CreatorSecondSign Respond contract--------------
function creatorSecondSign(id) {
    contractInstance.creatorSecondSign(id, status);
}


//setConfirm contract--------------
function setConfirm(id) {
    contractInstance.setConfirm(id);
}

//setCancel contract--------------
function setCancel(id) {
    contractInstance.setCancel(id);
}

//setPaid contract--------------
function setPaid(id) {
    contractInstance.setPaid(id);
}

//setDispute contract--------------
function setDispute(id) {
    contractInstance.setDispute(id);
}

//setStatusByAdmin contract--------------
function setStatusByAdmin(id, status) {
    contractInstance.setStatusByAdmin(id, status);
}
//acceptedTrade contract--------------
function acceptedTrade(address) {
    return contractInstance.acceptedTrade(address);
}

//openTrades Return array of contract ids ----------------------------
function openTrades() {
    return contractInstance.openTrades();
}

//Return contract details by id --------------
function getContract(id) {
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

}
