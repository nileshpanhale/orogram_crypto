var Web3 = require('web3');
var abi  = require('./abi.json')
const Tx = require('ethereumjs-tx');

const provider = new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/ff51df7e52384a9f9c397159a332da53");
var web3 = new Web3(provider);

var contractAddress = '0x1d55d7afb9a5c8c0071906830bb8f2bb3754bff5';
var publicKey = '0xBae94bf75a252395ffbAAc6d9D66B1Ef41D8153C'
let privateKey = new Buffer('B178CCE6814C8D52216D9A28F75CE3DC7407FE5DDDA0088541130BC81EB4E54A', 'hex')

// var CryptoGoldContract = web3.eth.contract(abi);
// var accounts = web3.eth.accounts;
// var owner = accounts[0];
// var contractInstance = CryptoGoldContract.at(contractAddress);

var Action=["NEW","CONFIRM","PENDING", "PAID", "CANCEL", "DISPUTE", "ACCEPT"];
//var owner = ContractInstance.owner.call();
const CryptoGoldContract = new web3.eth.Contract(abi, contractAddress);
// console.log("Res",getContract(66));

//create contract--------------
// function createContact(id,date,contractText,publicKey,privateKey){
//     // return new Promise((resolve,reject) => { 
//     const contractFunction = contractInstance.createContact.getData(id,date,contractText) // Here you can call your contract functions
//     let nonce;

//     web3.eth.getTransactionCount(publicKey, (err, _nonce) => {
//     nonce = _nonce.toString(16);

//         console.log("Nonce: " + nonce);

//         const txParams = {
//         gasPrice: 100000,
//         gasLimit: 3000000,
//         to: contractAddress,
//         data: contractFunction,
//         from: publicKey,
//         nonce: '0x' + nonce
//         };

//     const tx = new Tx(txParams);
//     tx.sign(privateKey); // Transaction Signing here

//     const serializedTx = tx.serialize();

//     web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), (err, hash) => {
//         if (err) { 
//             console.log(err); return; 
//         }
    
//         // Log the tx, you can explore status manually with eth.getTransaction()
//         console.log('Contract creation tx: ' + hash);
    
//         // Wait for the transaction to be mined
          
//         console.log('Contract address: ' + receipt.contractAddress);
//         console.log('Contract File: ' + contract);
//         console.log('Contract receipt: ' + receipt);
         
//         console.log('==============================');
    
//     });
//   });

//     // })
// }

// //Respond contract--------------
// function responderSign(id,status){
//     // return new Promise((resolve,reject) => { 
//        contractInstance.responderSign(id,status);
//     // })
// }

// //CreatorSecondSign Respond contract--------------
// function creatorSecondSign(id){
//     // return new Promise((resolve,reject) => { 
//        contractInstance.creatorSecondSign(id,status);
//     // })
// }


// //setConfirm contract--------------
// function setConfirm(id){
//     // return new Promise((resolve,reject) => { 
//        contractInstance.setConfirm(id);
//     // })
// }

// //setCancel contract--------------
// function setCancel(id){
//     // return new Promise((resolve,reject) => { 
//        contractInstance.setCancel(id);
//     // })
// }

// //setPaid contract--------------
// function setPaid(id){
//     // return new Promise((resolve,reject) => { 
//        contractInstance.setPaid(id);
//     // })
// }

// //setDispute contract--------------
// function setDispute(id){
//     // return new Promise((resolve,reject) => { 
//        contractInstance.setDispute(id);
//     // })
// }

// //setStatusByAdmin contract--------------
// function setStatusByAdmin(id,status){
//     // return new Promise((resolve,reject) => { 
//         console.log("In admin",status);
//         console.log("In admin action",Action[status]);
//         contractInstance.setStatusByAdmin(id,status);
//     // })
// }
// //acceptedTrade contract--------------
// function acceptedTrade(address){
//     // return new Promise((resolve,reject) => { 
//         return contractInstance.acceptedTrade(address);
//     // })
// }

// //openTrades Return array of contract ids ----------------------------
// function openTrades(){
//     // return new Promise((resolve,reject) => { 
//         return contractInstance.openTrades();
//     // })
// }

// CryptoGoldContract.methods.getContract(66).call().call((error, result) => {
//     console.log("Result",result);
//     console.log("Error",error);
// });
getContract();

async function getContract(){
 let res = await CryptoGoldContract.methods.getContract(66).call();
    console.log("Result",res);
}
    // console.log("Error",error);

//Return contract details by id --------------
// function getContract(id){
// // return new Promise((resolve,reject) => {
//     var data = contractInstance.getContract(id);

//     var contractData = {
//         "creator":data[0],
//         "responder":data[1],
//         "creatorFirstSign":data[2],
//         "creatorSecondSign":data[3],
//         "responderSign":data[4],
//         "contractText":data[5],
//         "contractValidity":data[6].toFixed(),
//         "status":Action[data[7].toFixed()]
//     }

//     return contractData;

//    // })
       

// }



