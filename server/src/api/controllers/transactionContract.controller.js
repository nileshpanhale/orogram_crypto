const httpStatus = require('http-status');
const contractService = require('../services/smartContractService');
const chargesService = require('../services/chargesTranceferService');
const axios = require('axios');
const Cryptr = require('cryptr');
const index = require("../../../../cryptogold-blockchain/src/index");
const trans = require("../models/transactions.model");
const Transaction = require('../models/transactionsContract.model');
const holdedCoins = require('../models/holdBalance.model');
const blkTRX = require("../models/tx.model");
const AutoIncrement = require('../models/autoincrement.model');
const User = require('../models/user.model');
const nftDB = require('../models/land.model');
const { blockchain, cryptrSecretKey } = require('../../config/vars');

const crypr = new Cryptr(cryptrSecretKey);

let ethPub = null;
let ethPriv = null;
let self = this;


/**
 * Create contract
 */
exports.saveTransaction = async (req, res, next) => {
    try {

        let type = null;
        let user = null;

        //normal data saving in Mongo-------------------

        let transaction = new Transaction(req.body);
        transaction.coins = req.body.coins / 100000000;
        transaction.isContract = req.body.isContract;
        transaction.contractDays = parseInt(req.body.contractDays);
        transaction._id = await getNextSequenceValue("product_id");

        transaction.creator = req.body.sender || req.body.receiver;
        user = req.body.sender || req.body.receiver;
        transaction.creatorEmail = req.body.creatorEmail;

        if (req.body.sender) {
            type = 'sell';
            transaction['transactionType'] = 'sell';
            let sender = await User.findById(req.body.sender);
            transaction['senderWallet'] = sender.account.address;
            ethPriv = crypr.decrypt(sender.ethPrivateKey);
            ethPub = sender.ethPublicKey;
        }
        if (req.body.receiver) {
            type = 'buy';
            transaction['transactionType'] = 'buy';
            let receiver = await User.findById(req.body.receiver);
            transaction['receiverWallet'] = receiver.account.address;
            ethPriv = crypr.decrypt(receiver.ethPrivateKey);
            ethPub = receiver.ethPublicKey;
        }

        //storing data on ETH blockchain ----------------------
        let contractDays = req.body.contractDays;
        let contractText = req.body.remarks;
        let imageUrl = req.body.picture[0];

        let data = await contractService.createContact(transaction._id, parseInt(contractDays), contractText, ethPub, ethPriv, imageUrl);
        console.log("////////////////////////////////////////////////////");
        console.log("Contract creation data : ", data.transactionHash);

        transaction['contractStatus'][0] = {
            contractHash: data.transactionHash,
            contractStatus: 'created'
        }

        console.log("Transaction details : ", transaction);
        const newTransaction = await (transaction).save();

        //calling admin charges sending service -----------------------   
        let adminPercentage;
        try {
            adminPercentage = chargesService.holdCharges('creator', newTransaction.id, user, type, req.body.coins);
        } catch (e) {
            console.log(e);
        }

        return res.send(newTransaction);

    } catch (err) {
        return next(err);
    }
}

//uploading Images of product --------------------------------------
exports.uploadFile = async (req, res, next) => {
    // console.log('files--------------------------', req.files, req.body[0]);
    try {

        res.send(req.files);
        // console.log('files', req);

    } catch (error) {
        console.log("err", error.message);

        next(error);
    }
};


exports.list = async (req, res, next) => {
    try {
        const transaction = await Transaction.list(req.query);
        res.json(transaction);
    } catch (error) {
        next(error);
    }
};

/**
 * Saves a transaction for purchasing crypto from admin
 * @public
 */
// const {io}=require('../../config/express')
exports.purchaseCoins = async (req, res, next) => {
    try {
        let user = req.user;
        //console.log("user",user);

        let transaction = new Transaction(req.body);

        if (user.userId === req.body['uniqueId']) {
            // let userAccount = await User.findOne({userId:user.userId});
            // console.log("USERACCOUNT",userAccount);
            // if(!userAccount.bankAccount.name){
            //     return res.status(httpStatus.NOT_FOUND).send({message: "Update the bank account detail"});
            // }
            let admin = await User.findOne({ role: 'admin' }); //admin.account.address;
            if (!admin) {
                return res.status(httpStatus.NOT_FOUND).send({ message: "Admin is not present" });
            }
            //console.log(user, "sender", admin, "receiver");

            transaction['sender'] = admin._id;
            transaction['senderWallet'] = admin.account.address;
            transaction['receiver'] = user._id;
            transaction['receiverWallet'] = user.account.address;
            transaction['receiverId'] = user.userId;
            // transaction['bankAccount']['name'] = userAccount.bankAccount.name;
            // transaction['bankAccount']['number'] = userAccount.bankAccount.number;
            // transaction['bankAccount']['swift'] = userAccount.bankAccount.swift;
        } else {
            return res.status(httpStatus.UNAUTHORIZED).send({ message: "Incorrect unique id" });
        }

        let newTransaction = await transaction.save();

        return res.status(httpStatus.OK).send(newTransaction);
    } catch (error) {
        next(error)
    }
}

/**
 * updates a transaction
 * @public
 */
exports.updateTransaction = async (req, res, next) => {
    try {

        let transaction = await Transaction.findById(req.params.id);
        let hold = 0;

        //if receiver: null, then sell transaction
        //if sender: null, then buy transaction
        //make it reverse in accepting side ----------

        if (transaction.receiver) {
            //buyer hold
            hold = transaction.coins * 0.04;
        } else if (transaction.sender) {
            //seller hold
            hold = transaction.coins * 1.02;
        }

        let bal = await index.checkBal(req.body.ethPublic);

        if (bal < hold) {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'Insufficient balance to accept contract' });
        }

        if (transaction.lock) {
            return res.status(httpStatus.NOT_FOUND).send({ message: "Transaction already completed" });
        }
        if ((transaction.sender && req.body.receiver) || (transaction.receiver && req.body.sender)) {
            if ((transaction.sender + '' == req.body.receiver + '') || (transaction.receiver + '' == req.body.sender + '')) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'Sender and receiver cannot be same' });
            }
            req.body['lock'] = true;
        }

        //Accepting contract on blockchain ------------------------------------------------------------------------------
        let data = await contractService.responderSign(req.params.id, true, req.body.ethPublic, crypr.decrypt(req.body.ethPrivate));
        console.log("Responder Hash : ", data.transactionHash);


        //creating expiry date from no of days given by user ---------------------------------

        let trandays = parseInt(transaction.contractDays);

        var expiryDate = (new Date(new Date().getTime() + (trandays * 24 * 60 * 60 * 1000))).getTime();

        //adding date param for saving -------
        req.body.contractDate = expiryDate;


        console.log("received data : ", req.body);
        let updatedTransaction = await Transaction.FindOneAndUpdate({ _id: req.params.id }, { $set: req.body });

        // update hash to db ------------------------------------------------
        let updatehash = await Transaction.FindOneAndUpdate({
            _id: req.params.id
        },
            {
                $push: {
                    contractStatus: {
                        contractHash: data.transactionHash,
                        contractStatus: 'accepted'
                    },
                }
            }
        );

        if (updatedTransaction) {

            let type = "";

            let usr = req.body.receiver || req.body.sender;

            if (transaction.receiver == null) { type = 'buy' }

            if (transaction.sender == null) { type = 'sell' }

            //calling admin charges sending service -----------------------   
            let coins = transaction.coins * (10 ** 8);
            let adminPercentage = await chargesService.holdCharges('accepter', transaction.id, usr, type, coins);

            return res.status(httpStatus.OK).send({ message: 'Transaction updated successfully' })
        }
    } catch (error) {
        next(error)
    }
}

/**
 * updates a transaction status
 * @public
 */
exports.updateTransactionStatus = async (req, res, next) => {
    try {

        console.log("senderSign", req.body);

        let transaction = await Transaction.findById(req.params.id);
        if (transaction.lock) {
            return res.status(httpStatus.NOT_FOUND).send({ message: "Transaction already completed" });
        }
        if ((transaction.sender && req.body.receiver) || (transaction.receiver && req.body.sender)) {
            if ((transaction.sender + '' == req.body.receiver + '') || (transaction.receiver + '' == req.body.sender + '')) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'Sender and receiver cannot be same' });
            }
            req.body['lock'] = true;
        }
        let updatedTransaction = await Transaction.FindOneAndUpdate({ _id: req.params.id }, { $set: req.body });
        if (updatedTransaction) {
            return res.status(httpStatus.OK).send({ message: 'transaction updated successfully' })
        }
    } catch (error) {
        next(error)
    }
}



exports.updateStatus = async (req, res, next) => {

    try {

        let datahash = ''
        this.Transaction = Transaction;



        let user = req.user;
        let transaction = await Transaction.findById(req.params.id);
        let holded = await holdedCoins.findOne({ transactionId: req.params.id });

        if (req.user._id + '' == transaction.receiver + '' && user.role != 'admin' && transaction.status == 'confirm') {
            return res.status(httpStatus.UNAUTHORIZED).send({ message: "You are not allowed to update status" });
        }

        if (transaction.status == 'confirm') {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction is already confirmed' });
        }

        if (transaction.status == 'cancel') {

            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction is already cancelled' });
        }

        if (req.body.status == 'paid') {
            let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status, picturePaid: req.body.paidrecipetImages });
            return res.status(httpStatus.OK).send({ message: "Paid Status updated succesfully" });
        }

        // trigger blockchain to transfer coin
        if (req.body.status && req.body.status == 'confirm') {

            //Confirming contract on blockchain ETH------------------------------------------------------------------------------
            datahash = await contractService.creatorSecondSign(req.params.id, req.body.status, req.body.ethPublic, crypr.decrypt(req.body.ethPrivate));
            console.log("second_datahash", datahash.transactionHash);

            let sellerHold;
            let coins = transaction.coins ? transaction.coins : req.body.coins;
            // coins = coins / 10 ** 8;

            if (!transaction.sender || !transaction.receiver) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'One party is missing! Cannot change status' });
            }
            if (req.user.role == 'admin') {
                if (!req.body.coins) {
                    return res.send({ message: "Send number of coins" });
                }
            }
            let secret;

            //opposite functionality in contract ------------

            let sender = await User.findById(transaction.receiver);
            console.log("Buyer : ", sender.email);
            let receiver = await User.findById(transaction.sender);
            console.log("Receiver : ", receiver.email);

            //system account details
            let admin1 = await User.findOne({ role: 'admin1' });
            let bal = await index.checkBal(admin1.ethPublicKey);

            //admin account details
            let admin = await User.findOne({ role: 'admin' });

            if (user.role == 'admin') {
                secret = user.account.secret;
            } else {
                secret = sender.account.privateKey;
            }

            let accountBalance = await index.checkBal(sender.ethPublicKey);
            bal = await chargesService.getUserBalance(user.id);
            console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
            console.log("Balance of user.id : ", bal);
            console.log("coins to send : ", coins);
            console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<");

            let sellerhold = holded._doc.sellerHoldedCoins;
            console.log("seller hold coin : ", sellerhold);
            let adminfee = holded._doc.buyerHoldedCoins - coins;
            console.log("buyer hold coin : ", adminfee, holded._doc.buyerHoldedCoins, coins);


            //sending contract coins to sellers account from system account
            try {
                contractCoin = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, receiver.ethPublicKey, coins);
                console.log("//////////////////////////////////////////////////////");
                console.log("Contract coins transferred successfully.");

                let TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: coins,
                    senderWallet: admin1.account.address,
                    receiverWallet: receiver.account.address,
                    transactionId: contractCoin.transactionHash
                });
                let newTRX = await TRX.save();
            } catch (e) {
                console.log(e);
            }

            //sending sellers holded coins back to sellers account
            try {
                sellerHold = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, receiver.ethPublicKey, holded._doc.sellerHoldedCoins);
                console.log("//////////////////////////////////////////////////////");
                console.log("Seller holded coins transferred successfully.");
                TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: holded._doc.sellerHoldedCoins,
                    senderWallet: admin1.account.address,
                    receiverWallet: receiver.account.address,
                    transactionId: sellerHold.transactionHash
                });
                newTRX = await TRX.save();
            } catch (e) {
                console.log(e);
            }


            //sending buyers holded coins to admin account as contract transaction fee
            if (sellerHold.status) {
                try {
                    let adminFees = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, admin.account.publicKey, adminfee);
                    console.log("//////////////////////////////////////////////////////");
                    console.log("Admin fees transferred successfully.");

                    TRX = new blkTRX({
                        type: 'coinTransfer',
                        status: 'holding',
                        coins: adminfee,
                        senderWallet: admin1.account.address,
                        receiverWallet: admin.account.address,
                        transactionId: adminFees.transactionHash
                    });
                    newTRX = await TRX.save();
                } catch (e) {
                    console.log(e);
                }
            }

            if (contractCoin) {
                let updatedTransaction = await Transaction.findByIdAndUpdate(
                    req.params.id,
                    {
                        status: req.body.status,
                        blockchainId: contractCoin.transactionHash,
                        coins: coins,
                        adminFee: adminfee
                    });

                // update hash to db ------------------------------------------------
                let updatehash = await Transaction.findByIdAndUpdate({
                    _id: req.params.id
                },
                    {
                        $push: {
                            contractStatus: {
                                contractHash: datahash.transactionHash,
                                contractStatus: 'creator_second_sign'
                            },
                        }
                    }
                )

                if (updatedTransaction) {
                    console.log("Transaction Updated in blockchain");
                    chargesService.releaseConfirmHoldCharges(req.params.id);
                    return res.status(httpStatus.OK).send({ message: "Transaction updated succesfully" });
                }
            }

        }

        if (req.body.status.toLowerCase() === 'cancel' && transaction.receiver && transaction.sender && transaction.receiver != 'undefined') {

            //removing holded coins form admin account on Cancel --------------------
            await chargesService.releaseHoldCharges(transaction.id);

            //Canceling contract on blockchain ETH ------------------------------------------------------------------------------
            let data = await contractService.setCancel(req.params.id, req.body.ethPublic, crypr.decrypt(req.body.ethPrivate));

            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction can not cancelled' });
        } else {

            if (req.body.status.toLowerCase() === 'dispute') {

                //Disputing contract on blockchain ETH------------------------------------------------------------------------------
                let data = await contractService.setDispute(req.params.id, req.body.ethPublic, crypr.decrypt(req.body.ethPrivate));

                // update hash to db ------------------------------------------------
                let updatehash = await Transaction.findByIdAndUpdate({
                    _id: req.params.id
                },
                    {
                        $push: {
                            contractStatus: {
                                contractHash: data,
                                contractStatus: 'dispute_added'
                            },
                        }
                    }
                )

                // await chargesService.releaseHoldCharges(transaction.id);

                let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status, disputedBy: user.email });

                return res.status(httpStatus.OK).send({ message: "Dispute updated succesfully" });

            } else {


                // update hash to db ------------------------------------------------
                let updatehash = await Transaction.findByIdAndUpdate({
                    _id: req.params.id
                },
                    {
                        $push: {
                            contractStatus: {
                                contractHash: "data",
                                contractStatus: 'cancelled'
                            },
                        }
                    }
                )

                //removing holded coins form admin account on cancel --------------------
                await chargesService.releaseHoldCharges(transaction.id);

                console.log('else')
                let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status });
                return res.status(httpStatus.OK).send({ message: "Transaction updated succesfully" });
            }

        }

    } catch (error) {
        console.log("error during transaction to block chain in transactionContract.controller.js at 545");
        next(error)
    }
}

/**
 * Admin will confirm the disputed transactions
 */
exports.confirmTransaction = async (req, res, next) => {
    try {

        let adminFee;
        let contractCoin;
        let adminfee;
        let user = req.user;
        let transaction = await Transaction.findById(req.params.id);
        let holded = await holdedCoins.findOne({ transactionId: req.params.id });
        adminFee = holded._doc.buyerHoldedCoins;
        if (user.role != 'admin') {
            return res.status(httpStatus.UNAUTHORIZED).send({ message: "You are not allowed to confirm transaction" });
        }

        if (transaction.status == 'confirm') {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction is already confirmed' });
        }

        if (transaction.status == 'cancel') {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction is already cancelled' });
        }

        if (req.body.status.toLowerCase() === 'cancel') {

            //removing holded coins form admin account on Cancel --------------------
            chargesService.releaseHoldCharges(transaction.id);
            let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status });

            return res.status(httpStatus.OK).send({ message: 'Transaction cancelled' });
        }

        // trigger blockchain to transfer coin
        if (req.body.status && req.body.status == 'confirm') {
            let coins = transaction.coins ? transaction.coins : req.body.coins;

            if (!transaction.sender || !transaction.receiver) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'One party is missing! Cannot change status' });
            }

            let secret;
            let sellerHold;

            //buyer account details
            let sender = await User.findById(transaction.receiver);
            //seller account details
            let receiver = await User.findById(transaction.sender);
            //system account details
            let admin1 = await User.findOne({ role: 'admin1' });
            let bal = await index.checkBal(admin1.ethPublicKey);

            //admin account details
            let admin = await User.findOne({ role: 'admin' });

            let accountBalance = await index.checkBal(holded._doc.buyerAddress);

            if (accountBalance) {
                if (accountBalance < coins) {
                    return res.status(httpStatus.BAD_REQUEST).send({ message: "Transaction cannot be done due to insufficient balance" });
                }
            } else {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Blockchain issue" });
            }

            //sending contract coins to sellers account from system account
            try {
                contractCoin = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, receiver.ethPublicKey, coins);
                console.log("///////////////////////////////////////////");
                console.log("Contract coins transferred.");
                let TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: coins,
                    senderWallet: admin1.account.address,
                    receiverWallet: receiver.account.address,
                    transactionId: contractCoin.transactionHash
                });
                let newTRX = await TRX.save();
            } catch (e) {
                console.log(e);
            }

            //sending sellers holded coins back to sellers account
            try {
                sellerHold = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, receiver.ethPublicKey, holded._doc.sellerHoldedCoins);
                console.log("///////////////////////////////////////////");
                console.log("Seller holded coins refunded.");
                TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: holded._doc.sellerHoldedCoins,
                    senderWallet: admin1.account.address,
                    receiverWallet: receiver.account.address,
                    transactionId: sellerHold.transactionHash
                });
                newTRX = await TRX.save();
            } catch (e) {
                console.log(e);
            }

            //sending buyers holded coins to admin account as contract transaction fee
            if (sellerHold.status) {
                try {
                    adminfee = holded._doc.buyerHoldedCoins - coins;
                    let adminFees = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, admin.account.publicKey, adminfee);
                    console.log("///////////////////////////////////////////");
                    console.log("Admin fee transferred.");
                    TRX = new blkTRX({
                        type: 'coinTransfer',
                        status: 'holding',
                        coins: adminfee,
                        senderWallet: admin1.account.address,
                        receiverWallet: admin.account.address,
                        transactionId: adminFees.transactionHash
                    });
                    newTRX = await TRX.save();
                } catch (e) {
                    console.log(e);
                }
            }


            if (contractCoin) {

                let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status, transactionId: contractCoin.transactionHash, coins: coins, adminFee: adminfee });

                if (updatedTransaction) {
                    chargesService.releaseConfirmHoldCharges(req.params.id);
                    return res.status(httpStatus.OK).send({ message: "Transaction updated succesfully" });
                }
            }
        } else {
            console.log("Transaction Rejected in blockchain");
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Issue with blockchain", contractCoin });;
        }

    } catch (error) {
        console.log(error, "error during transaction to Block-chain");
        next(error)
    }
}

/**
 * get list of user trades
 * @public
 */
exports.getUserTrades = async (req, res, next) => {
    try {

        let queryObj = {
            query: {
                type: 'trade',
                $or: [
                    { 'sender': req.user._id },
                    { 'receiver': req.user._id }
                ],
            }
        }

        if (req.query.paymentMode) {
            queryObj['query']['tradeType'] = req.query.paymentMode;
        }

        if (req.query.status) {
            queryObj['query']['status'] = req.query.status;
        }

        if (req.query.type) {
            if (req.query.type == 'sell') {
                queryObj['query']['sender'] = req.user._id
            }
            if (req.query.type == 'buy') {
                queryObj['query']['receiver'] = req.user._id
            }
        }
        queryObj['page'] = parseInt(req.query.page);
        queryObj['perPage'] = parseInt(req.query.perPage);

        if (req.query.searchString) {
            //console.log(queryObj.query.$or, "waallet");
            queryObj.query['$and'] = [
                {
                    $or: queryObj.query.$or
                },
                {
                    $or: [
                        { senderWallet: { $regex: new RegExp(req.query.searchString) } },
                        { receiverWallet: { $regex: new RegExp(req.query.searchString) } },
                        { senderAccount: { $regex: new RegExp(req.query.searchString) } },
                        { receiverAccount: { $regex: new RegExp(req.query.searchString) } },
                    ]
                }
            ];

            delete queryObj.query.$or;
        };

        let count;

        Transaction.find(queryObj['query'], (err, result) => {
            count = result.length
        })
        let transactions = await Transaction.find(queryObj['query']).sort({ createdAt: -1 });
        console.log("query check : ", queryObj['query']);
        console.log("check transactions : ", transactions);
        transactions.forEach(element => {
            if (element.sender && element.sender + '' == req.user._id + '') {
                element['transactionType'] = 'sell';
            } else {
                element['transactionType'] = 'buy';
            }
        });
        res.status(httpStatus.OK).json({ count, transactions });
    } catch (error) {
        next(error)
    }
}

/**
 * get all list of contracts
 * @public
 */
exports.getallContracts = async (req, res, next) => {

    try {

        let queryObj = {}

        queryObj['page'] = parseInt(req.query.page);
        queryObj['perPage'] = parseInt(req.query.perPage);

        let count;
        console.log(queryObj);
        Transaction.find(queryObj['query'], (err, result) => {
            count = result.length
            console.log("TRANSACTION", count);
        })
        let transactions = await Transaction.list(queryObj);

        res.status(httpStatus.OK).json({ count, transactions });
    } catch (error) {
        next(error)
    }
}

/**
 * get list of trades for admin to check trade history of platform
 * @public
 */
exports.getTradesHistory = async (req, res, next) => {

    try {
        if (req.user.role != 'admin' && req.user.role != 'subAdmin') {
            return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
        }
        let queryObj = { 'query': {} };

        if (req.query.wallet) {
            queryObj = { query: { $or: [{ senderWallet: req.query.wallet }, { receiverWallet: req.query.wallet }] } }
        }

        queryObj['query']['type'] = 'trade';

        if (req.query.country) {
            queryObj.query['country'] = req.query.country
        }
        if (req.query.currency) {
            queryObj.query['currency'] = req.query.currency
        }
        if (req.query.status) {
            queryObj.query['status'] = req.query.status
        }
        if (req.query.amount) {
            queryObj.query['amount'] = { $lt: parseInt(req.query.amount) }
        }
        if (req.query.startDate) {
            if (!queryObj['query']['createdAt']) {
                queryObj['query']['createdAt'] = {};
            }
            queryObj['query']['createdAt']['$gte'] = new Date(req.query.startDate)
        }
        if (req.query.endDate) {
            if (!queryObj['query']['createdAt']) {
                queryObj['query']['createdAt'] = {};
                queryObj['query']['createdAt']['$lte'] = new Date(req.query.endDate)
            }
        }
        queryObj['page'] = req.query.page ? parseInt(req.query.page) : 1;
        queryObj['perPage'] = req.query.perPage ? parseInt(req.query.perPage) : 10;
        let count;
        Transaction.find(queryObj['query'], (err, result) => {
            count = result.length
        })
        let transactions = await Transaction.find(queryObj['query']).sort({ createdAt: -1 });
        res.status(httpStatus.OK).send({ count, transactions });
    } catch (error) {
        next(error)
    }
}

/**
 * get list of trades for user to sell/buy coins
 * @public
 */
exports.getTrades = async (req, res, next) => {
    try {

        console.log("User wallet address : ", req.user.account.address);
        console.log("req.query : ", req.query);

        let queryObj = { 'query': {} };
        queryObj['query']['type'] = 'trade';

        //getting contract and contract date----------
        queryObj['query']['contractDate'];

        //filter open contract here ---
        if (req.query.isContract) {
            queryObj['query']['isContract'] = true;
            queryObj['query']['isClosedContract'] = false;
        }

        //filtering closed contract here with rquested user email -----
        if (req.query.isClosedContract) {
            queryObj['query']['isClosedContract'] = true;
            queryObj['query']['contractUserEmail'] = req.user.email;
        }

        queryObj.query['status'] = 'pending' || 'dispute';
        queryObj.query['lock'] = false;

        // queryObj.query['']
        if (req.query.country) {
            queryObj.query['country'] = req.query.country
        }

        if (req.query.currency) {
            queryObj.query['currency'] = req.query.currency
        }

        if (req.query.coins) {
            queryObj.query['coins'] = { $lt: req.query.coins }
        }

        if (req.query.startDate) {
            if (!queryObj['query']['createdAt']) {
                queryObj['query']['createdAt'] = {};
            }
            queryObj['query']['createdAt']['$gte'] = new Date(req.query.startDate)
        }

        if (req.query.endDate) {
            if (!queryObj['query']['createdAt']) {
                queryObj['query']['createdAt'] = {};
                queryObj['query']['createdAt']['$lte'] = new Date(req.query.endDate)
            }
        }

        //hiding self transactions here ------------------
        if (req.query.type == 'buy') {
            queryObj.query['receiver'] = null;
            queryObj.query['senderWallet'] = { $ne: req.user.account.address }
        }

        if (req.query.type == 'sell') {
            queryObj.query['sender'] = null;
            queryObj.query['receiverWallet'] = { '$ne': req.user.account.address };
        }

        let count;
        const transactions = await Transaction.find(queryObj['query']).sort({ createdAt: -1 });
        // const transactions = await Transaction.find({"senderWallet":{$ne:req.user.account.address}, "receiver" : null, "status" : 'pending'});
        count = transactions.length;

        res.status(httpStatus.OK).send({ count, transactions });
    } catch (error) {
        next(error)
    }
}

/**
 * get list of transactions
 * @public
 */
exports.getPurchaseCoins = async (req, res, next) => {
    try {
        let queryObj = {};

        queryObj = {
            query: {
                type: { $in: ['btc', 'wire'] }
            }
        }
        if (req.user.role == 'user') {
            queryObj['query']['receiver'] = req.user._id;
        }
        // ----- filters -----
        if (req.query.status) {
            queryObj['query']['status'] = req.query.status;
        }
        // ----------- Debug when both start and end date comes returns only 1 --------------
        if (req.query.startDate) {
            if (!queryObj['query']['createdAt']) {
                queryObj['query']['createdAt'] = {};
            }
            queryObj['query']['createdAt']['$gte'] = new Date(req.query.startDate)
        }
        if (req.query.endDate) {
            if (!queryObj['query']['createdAt']) {
                queryObj['query']['createdAt'] = {};
                queryObj['query']['createdAt']['$lte'] = new Date(req.query.endDate)
            }
        }
        queryObj['page'] = parseInt(req.query.page);
        queryObj['perPage'] = parseInt(req.query.perPage);
        let count;
        Transaction.find(queryObj['query'], (err, result) => {
            count = result.length
        })

        let transactions = await Transaction.list(queryObj);
        transactions.forEach(element => {
            element['transactionType'] = 'purchase';
        });

        res.json({ transactions, count });
    } catch (error) {
        next(error);
    }
}


exports.sendCoins = async (req, res, next) => {
    try {
        let admin = req.user;
        let transaction;
        if (admin.role != 'admin' && admin.role != 'subAdmin') {
            return res.status(UNAUTHORIZED).send({ message: "Unauthorized access" });
        }
        if (admin.role != 'subAdmin') {
            admin = await User.findOne({ role: 'admin' });
        }
        let coins = req.body.coins;
        let secret = admin.account.secret || cryptr.decrypt(admin.account.privateKey);

        let payload = {
            secret: secret,
            amount: coins,
            publicKey: admin.account.publicKey,
            recipientId: req.body.walletAddress
        }

        // let accountBalance = await axios.get(blockchain.baseUrl + blockchain.getBalance + admin.account.address);
        let accountBalance = await index.checkBal(admin.ethPublicKey);
        let bal = await chargesService.getUserBalance(user.id);

        if (accountBalance.data.success) {
            // if(accountBalance.data.balance < coins) {
            if (bal.calculatedCoins < coins) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: "Transaction cannot be done due to insufficient balance" });
            }
        } else {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Blockchain issue" });
        }
        let response = await axios.put(blockchain.baseUrl + blockchain.transfer, payload);

        if (response.data.success) {
            transaction = new Transaction({
                type: 'coinTransfer',
                status: 'confirm',
                coins: coins,
                senderAccount: admin.account.address,
                receiverAccount: req.body.walletAddress,
                sender: admin._id,
                remarks: req.body.remarks || null,
                transactionId: response.data.transactionId
            });

            let receiver = await User.find({ 'account.address': req.body.walletAddress });
            if (receiver) {
                transaction['receiver'] = receiver._id;
            }
            let newTransaction = await transaction.save();
            res.status(httpStatus.OK).send({ message: "Coin transfer request is created" });
        } else {
            res.status(httpStatus.OK).send({ message: "Issue with blockchain", responseFromBlockchain: response.data });
        }



    } catch (error) {
        next(error);
    }
}

exports.directTransfer = async (req, res, next) => {
    try {
        let user = req.user;
        let transaction;
        let existUser = await User.findOne({ _id: user._id });

        let coins = req.body.coins;
        let secret = existUser.account.secret || getSecret(cryptr.decrypt(existUser.account.privateKey));
        //console.log(secret, "secret");

        let payload = {
            secret: secret,
            amount: coins,
            publicKey: existUser.account.publicKey,
            recipientId: req.body.walletAddress
        }

        // let accountBalance = await axios.get(blockchain.baseUrl + blockchain.getBalance + existUser.account.address);
        let accountBalance = await index.checkBal(existUser.ethPublicKey);
        let bal = await chargesService.getUserBalance(user.id);

        if (accountBalance.data.success) {
            // if(accountBalance.data.balance < coins) {
            if (bal.calculatedCoins < coins) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: "Transaction cannot be done due to insufficient balance" });
            }
        } else {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Blockchain issue" });
        }

        let response = await axios.put(blockchain.baseUrl + blockchain.transfer, payload);
        console.log("payload", payload);
        if (response.data.success) {
            transaction = new Transaction({
                type: 'directTransfer',
                status: 'confirm',
                coins: coins,
                senderAccount: existUser.account.address,
                receiverAccount: req.body.walletAddress,
                sender: existUser._id,
                remarks: req.body.remarks || null
            });
            let receiver = await User.find({ 'account.address': req.body.walletAddress });
            if (receiver) {
                transaction['receiver'] = receiver._id;
            }
            let newTransaction = await transaction.save();
            res.status(httpStatus.OK).send({ message: "Coin transfer request is created" });
        } else {
            res.status(httpStatus.OK).send({ message: "Issue with blockchain", responseFromBlockchain: response.data });
        }


    } catch (error) {
        next(error);
    }
}

exports.getAdminTransactions = async (req, res, next) => {
    try {
        let admin = req.user;
        //console.log(admin, "admin user found");

        if (admin.role != 'admin' && admin.role != 'subAdmin') {
            return res.send(httpStatus.UNAUTHORIZED).send({ message: 'Unauthorized' });
        }
        let adminUser = await User.findOne({ role: 'admin' });
        let queryObj = {};
        queryObj = {
            query: {
                type: "coinTransfer",
                senderAccount: adminUser.account.address
            }
        }
        queryObj['page'] = parseInt(req.query.page);
        queryObj['perPage'] = parseInt(req.query.perPage);
        let count;
        Transaction.find(queryObj['query'], (err, result) => {
            count = result.length
        })
        //console.log(queryObj, "query obj in controller");        
        let transactions = await Transaction.list(queryObj);
        console.log("transaction", transactions);
        //console.log(transactions, "fpound ");
        return res.status(httpStatus.OK).send({ count, transactions });

    } catch (error) {

    }
}

exports.getUserTransactions = async (req, res, next) => {
    try {
        let user = req.user;
        //console.log(user, "user user found");
        console.log(blockchain.baseUrl + blockchain.getUserTransactions + user.account.address, "url to hit");

        let response = await axios.get(blockchain.baseUrl + blockchain.getUserTransactions + user.account.address + `&limit=${req.query.limit}&offset=${req.query.offset - 1}`);
        //console.log( response.data, "response from blockchain is user");

        if (response.data.success) {
            return res.status(httpStatus.OK).send(response.data);
        } else {
            res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Incorrect blockchain response", response: response.data })
        }
    } catch (error) {
        console.log(error, "error during getting user transaction in transaction.controller.js at line no. 1252");

        next(error);
    }
}

exports.getAccountCoinDetail = async (req, res, next) => {

    console.log("Account Details : ", req.params);
    try {
        let queryObj = {};
        let coinValue = 0;
        queryObj = {
            query: {
                status: { $in: ['pending', 'dispute'] },
                type: 'trade'
            }
        }
        if (req.params.address) {
            queryObj['query']['$or'] = [{ 'senderWallet': req.params.address }, { 'receiverWallet': req.params.address }];
        }

        Transaction.find(queryObj['query'], (err, result) => {
            if (result) {
                //console.log("RES",result);
                for (let i = 0; i < result.length; i++) {
                    coinValue = coinValue + result[i].coins;
                }
                return res.status(httpStatus.OK).json({ coinValue });
            }
            else {
                return res.status(httpStatus.error).json({ message: "Not able to get the result" });
            }
        })
    } catch (error) {
        console.log(error, "error during getting user transaction in transaction.controller.js at line no. 1251");

        next(error);
    }
}

//search user by email here -------------------------------------------
exports.getUserSearch = async (req, res, next) => {
    try {

        console.log("users search data", req.params.query);

        var regex = new RegExp(req.params.query);

        return User.find({ email: regex }, function (err, q) {
            return res.send(q);
        });


    } catch (error) {
        console.log(error, "error during getting users data");

        next(error);
    }

};


//get contract Hash trasaction details here -------------------------------------------
exports.getContractDetails = async (req, res, next) => {

    try {

        let transaction = await Transaction.aggregate([
            {
                "$match": {
                    "contractStatus": {
                        "$elemMatch": {
                            "contractHash": req.params.hash
                        }
                    },
                }
            },
            {
                "$project": {
                    "contract": "$$ROOT"
                }
            }
        ]);

        if (transaction.length == 0) {
            return res.status(404).json({ message: "No Hash Found in Blockchain" });
        }

        return res.status(httpStatus.OK).send(transaction);

    } catch (error) {
        console.log(error, "error during getting Hash details");

        next(error);
    }

};


//get contract Hash trasaction details here -------------------------------------------
exports.getTradeDetail = async (req, res, next) => {

    try {

        let transaction = await trans.aggregate([
            {
                "$match": {
                    "transactionId": req.params.hash,
                }
            },
            {
                "$project": {
                    "contract": "$$ROOT"
                }
            }
        ]);

        if (transaction.length == 0) {
            return res.status(404).json({ message: "No Hash Found in Blockchain" });
        }

        return res.status(httpStatus.OK).send(transaction);

    } catch (error) {
        console.log(error, "error during getting Hash details");

        next(error);
    }
};


//get contract Hash trasaction details here -------------------------------------------
exports.getAdminTxDetail = async (req, res, next) => {

    try {
        let transaction = await trans.aggregate([
            {
                "$match": {
                    "transactionId": req.params.hash,
                }
            },
            {
                "$project": {
                    "contract": "$$ROOT"
                }
            }
        ]);
        if (transaction.length == 0) {
            return res.status(404).json({ message: "No Hash Found in Blockchain" });
        }

        return res.status(httpStatus.OK).send(transaction);

    } catch (error) {
        console.log(error, "error during getting Hash details");

        next(error);
    }

};


//search contract trasaction description here -------------------------------------------
exports.getDescriptionSearch = async (req, res, next) => {
    try {

        console.log("description search data", req.params.query);

        var regex = new RegExp(req.params.query);

        return Transaction.find({ remarks: regex }, function (err, q) {
            return res.send(q);
        });


    } catch (error) {
        console.log(error, "error during getting users data");

        next(error);
    }

};


exports.mintLandNFT = async (req, res) => {
    try {

        console.log("Purchase land API hitting.", req.body);
        let landNFT = new nftDB(req.body);
        // let user = await User.findOne({ email: req.body.email });
        // console.log("Fetched user details : ", user);
        landNFT.owner = req.body.email;
        landNFT.coordinates = req.body.markers;
        landNFT.area = req.body.area;

        const newLand = await landNFT.save();
        console.log("Data saved successfully : ", newLand);


        return res.status(httpStatus.OK).send(newLand);


    } catch (error) {
        console.log(error);
    }
};

exports.readMap = async (req, res) => {
    try {
        let mapData = await nftDB.find();
        console.log("Fetched map data : ", mapData);

        if (mapData.length == 0) {
            return res.status(404).json({ message: "No coordinates Found for google map." });
        }

        return res.status(httpStatus.OK).send(mapData);


    } catch (error) {
        console.log(error)
    }
}



function intToDecimal(input) {
    if (!input) {
        return '0.0';
    }

    input = input.toString();

    while (input.length < 9) {
        input = '0'.concat(input);
    }

    var intPart = input.slice(0, -8);
    var decimal = input.slice(-8);

    var clearView = false;

    while (!clearView) {
        if (decimal[decimal.length - 1] == '0') {
            decimal = decimal.slice(0, decimal.length - 1);
        } else {
            clearView = true;
        }
    }
    if (decimal && decimal.length > 0) {
        decimal = '.' + decimal;
    }
    return intPart + '' + decimal;
}

function isCorrectValue(currency, throwError, decimalsVal) {
    var parts = String(currency).trim().split('.');
    var amount = parts[0];
    var fraction = '';

    if (!throwError) throwError = false;

    function error(message) {
        var errorMsg = message;

        if (throwError) {
            throw errorMsg;
        } else {
            console.error(message);
            return false;
        }
    }

    if (amount == '') {
        return error('LIPS amount can not be blank');
    }

    if (parts.length == 1) {
        // No fractional part
        for (let k = 0; k < decimalsVal; k++) {
            fraction = fraction + '0';
        }
    } else if (parts.length == 2) {
        if (parts[1].length > 8) {
            return error('LIPS amount must not have more than 8 decimal places');
        } else if (parts[1].length <= 8) {
            // Less than eight decimal places
            fraction = parts[1];
        } else {
            // Trim extraneous decimal places
            fraction = parts[1].substring(0, 8);
        }
    } else {
        return error('LIPS amount must have only one decimal point');
    }

    // Pad to eight decimal places
    for (var i = fraction.length; i < 8; i++) {
        fraction += '0';
    }

    // Check for zero amount
    if (amount == '0' && fraction == '00000000') {
        return error('LIPS amount can not be zero');
    }

    // Combine whole with fractional part
    var result = amount + fraction;

    // In case there's a comma or something else in there.
    // At this point there should only be numbers.
    if (!/^\d+$/.test(result)) {
        return error('LIPS amount contains non-numeric characters');
    }

    // Remove leading zeroes
    result = result.replace(/^0+/, '');

    return parseInt(result);
}

function getSecret(secret) {
    var secretSplit = secret.split(" ");
    var newSecret = " ";
    for (let i = 0; i < 12; i++) {
        newSecret = newSecret + secretSplit[i] + " ";
    }
    return (newSecret.trim());
}


async function getNextSequenceValue(sequenceName) {
    var sequenceDocument = await AutoIncrement.findOneAndUpdate(
        { sequence_name: sequenceName },
        { $inc: { sequence_value: 1 } },
        {
            upsert: true, returnNewDocument: true
        });
    return sequenceDocument.sequence_value;
}