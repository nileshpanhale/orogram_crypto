const httpStatus = require('http-status');
const axios = require('axios');
const Cryptr = require('cryptr');
const chargesService = require('../services/chargesTranceferService');
const Transaction = require('../models/transactions.model');
const CTransaction = require('../models/transactionsContract.model');
const blkTRX = require("../models/tx.model");
const User = require('../models/user.model');
const { blockchain, cryptrSecretKey } = require('../../config/vars');
const index = require('../../../../cryptogold-blockchain/src/index');

const Enquiry = require('./enquiry.controller');
const Rates = require('../models/goldRate.model');
const { result } = require('lodash');
const { connections } = require('mongoose');
const { confirmTransaction } = require('./transactionContract.controller');

const crypr = new Cryptr(cryptrSecretKey);


//test api
exports.confirmCoin = async (req, res, next) => {
    try {

        let rates = await Rates.findOne();

        Transaction.findOneAndUpdate({
            _id: req.body.id
        },
            { $set: { coins: req.body.coins / 100000000, status: req.body.status } },
            { upsert: true }, function (err, doc) {
                if (err) { throw err; }
                else {
                    console.log("DB updated successfully");
                    res.status(200).json({
                        "msg": "API is working.",
                        "status": 200
                    })
                }
            });
    } catch (e) {
        console.log(e);
    }
}


/**
 * Create order
 */
exports.saveTransaction = async (req, res, next) => {

    try {

        let user = null;
        let type = null;

        let transaction = new Transaction(req.body);

        transaction.isContract = req.body.isContract;
        transaction.contractDate = req.body.contractDate;
        transaction.coins = req.body.coins / (10 ** 8);

        //receive users id of mongo index
        transaction.creator = req.body.sender || req.body.receiver;
        user = req.body.sender || req.body.receiver;
        transaction.creatorEmail = req.body.creatorEmail;
        if (req.body.sender) {
            type = 'sell';
            let sender = await User.findById(req.body.sender);
            transaction['senderWallet'] = sender.account.address;
            if (sender.bankAccounts.length >= 0 && req.body.tradeType == 'bank') {
                for (let i = 0; i <= sender.bankAccounts.length; i++) {
                    if (sender.bankAccounts[i].accountNumber == req.body.senderAccount) {
                        transaction['bankAccount']['beneficiary'] = sender.bankAccounts[i].beneficiary;
                        transaction['bankAccount']['name'] = sender.bankAccounts[i].bankName;
                        transaction['bankAccount']['number'] = sender.bankAccounts[i].accountNumber;
                        transaction['bankAccount']['swift'] = sender.bankAccounts[i].swiftCode;
                        transaction['bankAccount']['country'] = sender.bankAccounts[i].country;
                        transaction['bankAccount']['city'] = sender.bankAccounts[i].city;
                        break;
                    }
                }
            }
        }
        if (req.body.receiver) {
            type = 'buy';
            let receiver = await User.findById(req.body.receiver);
            transaction['receiverWallet'] = receiver.account.address;
            if (receiver.bankAccounts.length >= 0 && req.body.tradeType == 'bank') {
                for (let i = 0; i <= receiver.bankAccounts.length; i++) {
                    if (receiver.bankAccounts[i].accountNumber == req.body.receiverAccount) {
                        transaction['bankAccount']['beneficiary'] = receiver.bankAccounts[i].beneficiary;
                        transaction['bankAccount']['name'] = receiver.bankAccounts[i].bankName;
                        transaction['bankAccount']['number'] = receiver.bankAccounts[i].accountNumber;
                        transaction['bankAccount']['swift'] = receiver.bankAccounts[i].swiftCode;
                        transaction['bankAccount']['country'] = receiver.bankAccounts[i].country;
                        transaction['bankAccount']['city'] = receiver.bankAccounts[i].city;
                        break;
                    }
                }
            }
        }

        const newTransaction = await (transaction).save();

        //calling hold charges sending service -----------------------    
        let adminPercentage = await chargesService.holdChargesTrade('creator', newTransaction.id, user, type, req.body.coins);
        return res.send(newTransaction);

    } catch (err) {
        return next(err);
    }
}

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
exports.purchaseCoins = async (req, res, next) => {
    try {

        let user = req.user;

        /**
         * @dev user transaction record in Transaction model
         */
        let transaction = new Transaction(req.body);
        if (user.userId === req.body['uniqueId']) {

            let admin = await User.findOne({ role: 'admin' });
            if (!admin) {
                return res.status(httpStatus.NOT_FOUND).send({ message: "Admin is not present" });
            }

            transaction['senderId'] = admin.userId;
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

        let rates = await Rates.findOne();

        transaction['goldprice'] = rates.gold;
        transaction['btcprice'] = rates.btcprice;
        transaction['bitorobtc'] = rates.bitorobtc;
        console.log("Created Transaction : ", transaction);

        let newTransaction = await transaction.save();

        return res.status(httpStatus.OK).send(newTransaction);
    } catch (error) {
        next(error)
    }
}


/**
 * Saves a transaction for purchasing crypto from user to admin new -----------------------------
 * Admin reuesting to user to sell coins, sender will select after accepting trade.
 * @public
 */
exports.purchaseCoinsAdmin = async (req, res, next) => {
    try {

        //user who initiate coin sell to admin transaction
        let user = req.user;
        let transaction = new Transaction(req.body);

        if (user.userId === req.body['uniqueId']) {

            let userAccount = await User.findOne({ userId: user.userId });
            let bal = await index.checkBal(userAccount.ethPublicKey);

            if (bal == 0 || bal < req.body.coins) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'Insufficient balance.' });
            }

            // if (!userAccount.bankAccounts[0].bankName) {
            //     return res.status(httpStatus.NOT_FOUND).send({ message: "Update the bank account detail" });
            // }

            let admin = await User.findOne({ role: 'admin' });
            if (!admin) {
                return res.status(httpStatus.NOT_FOUND).send({ message: "User is not present" });
            }
            //console.log(user, "sender", admin, "receiver");
            // transaction['sender'] = admin._id;
            // transaction['senderWallet'] = admin.account.address;
            // transaction['receiver'] = user._id;
            // transaction['receiverWallet'] = user.account.address;
            // transaction['receiverId'] = user.userId;

            transaction['senderId'] = user.userId
            transaction['sender'] = user._id;
            transaction['senderWallet'] = user.account.address;
            transaction['receiver'] = admin._id;
            transaction['receiverWallet'] = admin.account.address;
            transaction['receiverId'] = admin.userId;
            // transaction['bankAccount']['name'] = userAccount.bankAccount.name;
            // transaction['bankAccount']['number'] = userAccount.bankAccount.number;
            // transaction['bankAccount']['swift'] = userAccount.bankAccount.swift;
        } else {
            return res.status(httpStatus.UNAUTHORIZED).send({ message: "Incorrect unique id" });
        }

        let newTransaction = await transaction.save();
        let adminPercentage = await chargesService.holdChargesTrade('user', newTransaction.id, user._id, "adminsell", req.body.coins);
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
        console.log("check transaction : ", transaction);

        let usr = req.body.receiver || req.body.sender;
        let user = await User.findById(usr);
        let bal = await index.checkBal(user.ethPublicKey);
        console.log("bal : ", bal);

        if (transaction.sender == null) {
            let percentage = 0.01;
            let percentageAdmin = transaction.coins + (transaction.coins * percentage);
            console.log("hold coins for sell : ", percentageAdmin);
            if (bal < percentageAdmin) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'Insufficient balance.' });
            }
        } else if (transaction.receiver == null) {
            let percentage = 0.04;
            let percentageAdmin = (transaction.coins * percentage);
            console.log("hold coins for buy : ", percentageAdmin);
            if (bal < percentageAdmin) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'Insufficient balance.' });
            }
        }

        // if (bal < transaction.coins) {
        //     return res.status(httpStatus.BAD_REQUEST).send({ message: 'Insufficient balance.' });
        // }

        if (transaction.lock) {
            return res.status(httpStatus.NOT_FOUND).send({ message: "Transaction already completed" });
        }
        if ((transaction.sender && req.body.receiver) || (transaction.receiver && req.body.sender)) {
            if ((transaction.sender + '' == req.body.receiver + '') || (transaction.receiver + '' == req.body.sender + '')) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'Sender and receiver cannot be same' });
            }
            req.body['lock'] = true;
        }
        if (transaction.tradeType == "bank") {
            let userObj = await User.findOne({ "account.address": req.body.receiverWallet || req.body.senderWallet, "bankAccounts.accountNumber": req.body.receiverAccount || req.body.senderAccount }, { bankAccounts: 1 });
            userObj.bankAccounts.forEach((e) => {
                if (e.accountNumber == (req.body.receiverAccount || req.body.senderAccount)) {
                    req.body.traderAccountDetails = e;
                }
            });
        }

        let updatedTransaction = await Transaction.FindOneAndUpdate({ _id: req.params.id }, { $set: req.body });
        if (updatedTransaction) {

            let type = "";
            if (transaction.receiver == null) { type = 'buy' }
            if (transaction.sender == null) { type = 'sell' }

            let adminPercentage = await chargesService.holdChargesTrade('accepter', transaction.id, usr, type, transaction.coins);
            return res.status(httpStatus.OK).send({ message: 'transaction updated successfully' })
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

        let results;
        let user = req.user;
        let adminfee = 0;
        let transaction = await Transaction.findById(req.params.id);

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

            //updating Images to db
            let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status, picturePaid: req.body.paidrecipetImages });

            return res.status(httpStatus.OK).send({ message: 'Paid Status Updated Successfully' });

        }

        // trigger blockchain to transfer coin ===========================
        if (req.body.status && req.body.status == 'confirm') {

            //this will get admin inputed coin count in object
            let coins = transaction.coins ? transaction.coins : req.body.coins;

            if (!transaction.sender || !transaction.receiver) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'One party is missing! Cannot change status' });
            }
            if (req.user.role == 'admin') {
                if (!req.body.coins) {
                    return res.send({ message: "Send number of coins" });
                }
            }
            let secret;

            let sender = await User.findById(transaction.sender);
            let receiver = await User.findById(transaction.receiver);

            if (user.role == 'admin') {
                sender = user;
            } else if (user.account.address == transaction.senderAccount) {

                //here we are fetching admin account private key
                secret = sender.account.privateKey;
                sender = user;
            }

            let accountBalance = await index.checkBal(sender.ethPublicKey);
            let admin1 = await User.findOne({ role: 'admin1' });
            let bal = await chargesService.getUserBalance(user._id);

            if (transaction.sender && transaction.receiver) {

                if (sender.role == 'admin') {

                    results = await index.Transfer(sender.ethPublicKey, sender.ethPrivateKey, receiver.ethPublicKey, coins);
                    console.log(`${coins} Orogram transferred from ${sender.email} to ${receiver.email} : `, results);

                    let TRX = new blkTRX({
                        type: 'coinTransfer',
                        status: 'confirm',
                        coins: coins,
                        senderWallet: sender.account.address,
                        receiverWallet: receiver.account.address,
                        transactionId: results.transactionHash
                    });
                    let newTRX = await TRX.save();

                } else {

                    //transferring trade coins from system to receiver
                    results = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, receiver.ethPublicKey, coins);
                    console.log(`${coins} Orogram transferred from ${admin1.email} to ${receiver.email} : `, results);

                    let TRX = new blkTRX({
                        type: 'coinTransfer',
                        status: 'holding',
                        coins: coins,
                        senderWallet: admin1.account.address,
                        receiverWallet: receiver.account.address,
                        transactionId: results.transactionHash
                    });
                    let newTRX = await TRX.save();

                    //transferring receivers holded coins
                    const receiverHold = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, receiver.ethPublicKey, (coins * 0.04));
                    console.log(`${(coins * 0.04)} Orogram transferred from ${admin1.email} to ${receiver.email} : `, receiverHold);

                    TRX = new blkTRX({
                        type: 'coinTransfer',
                        status: 'holding',
                        coins: (coins * 0.04),
                        senderWallet: admin1.account.address,
                        receiverWallet: receiver.account.address,
                        transactionId: receiverHold.transactionHash
                    });
                    newTRX = await TRX.save();

                    //getting admin address ----------
                    let admin = await User.findOne({ role: 'admin' });

                    //transferring admin fees
                    const adminCharge = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, admin.account.publicKey, (coins * 0.01));
                    console.log(`${(coins * 0.01)} Orogram transferred to admin as a transaction fee : `, adminCharge);
                    adminfee = coins * 0.01;
                    TRX = new blkTRX({
                        type: 'coinTransfer',
                        status: 'holding',
                        coins: (coins * 0.01),
                        senderWallet: admin1.account.address,
                        receiverWallet: admin.account.address,
                        transactionId: adminCharge.transactionHash
                    });
                    newTRX = await TRX.save();
                }

            } else {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Blockchain issue" });
            }

        }

        if (req.body.status.toLowerCase() === 'cancel' && transaction.receiver && transaction.sender && transaction.receiver != 'undefined') {

            // chargesService.releaseHoldTradeCharges(req.params.id);
            console.log("cancel trade function hitting.");
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction can not cancelled' });

        } else {


            if (req.body.status.toLowerCase() === 'dispute') {

                //dispute here  (not releasing hold balance) -----

                let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status, disputedBy: user.firstName });
                return res.status(httpStatus.OK).send({ message: "Dispute updated succesfully" });

            } else {

                //Releasing holded funds from Admin. Updating wallet details as well ---------- 
                chargesService.releaseConfirmTradeCharges(req.params.id);

                let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status, coins: req.body.coins, adminFee: adminfee, transactionId: results.transactionHash });
                return res.status(httpStatus.OK).send({ message: "Transaction updated succesfully" });

            }

        }

    } catch (error) {
        console.log("error during transaction to block chain in transaction.controller.js in 523", error);
        next(error)
    }
}



//accept admin trade by user to send coins -----------------------
exports.acceptAdminPurchaseRequest = async (req, res, next) => {

    try {

        let user = req.user;

        //get transaction by id & update sender id & wallet address
        let transaction = await Transaction.findById(req.params.id);




    } catch (error) {
        console.log("error during transaction to block chain in transaction.controller.js at 543");
        next(error)
    }

}

//updating status by user to pay coins to admin ----------------------------------
exports.updateStatusUser = async (req, res, next) => {
    try {

        let result;
        let user = req.user;
        let transaction = await Transaction.findById(req.params.id);

        let amount = transaction.coins ? transaction.coins : req.body.coins;

        if (req.user._id + '' == transaction.sender + '' && user.role != 'user' && transaction.status == 'confirm') {
            return res.status(httpStatus.UNAUTHORIZED).send({ message: "You are not allowed to update status" });
        }

        if (transaction.status.toLowerCase() == 'confirm') {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction is already confirmed' });
        }

        if (transaction.status.toLowerCase() == 'cancel') {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction is already cancelled' });
        }

        let sender = await User.findById(transaction.sender); //user
        let receiver = await User.findById(transaction.receiver); //admin

        // trigger blockchain to transfer coin
        if (req.body.status && req.body.status.toLowerCase() == 'confirm') {

            if (!transaction.sender || !transaction.receiver) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'One party is missing! Cannot change status' });
            }

            if (sender.role == 'admin') {
                if (!req.body.coins) {
                    return res.send({ message: "Send number of coins" });
                }
            }

            if (sender.role == 'admin') {
                secret = user.account.secret;
            } else {
                secret = await getSecret(crypr.decrypt(sender.ethPrivateKey));
            }

            // let response = await axios.get(blockchain.baseUrl + blockchain.getAccount + sender.account.address);
            let response = await index.checkBal(sender.ethPublicKey);

            //calling admin charges sending service    
            let bal = await chargesService.getUserBalance(sender.id);

            if (response < req.body.coins) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: "Transaction cannot be done due to insufficient balance" });
            }

            let payload = {
                secret: crypr.decrypt(sender.ethPrivateKey),
                amount: amount,
                publicKey: sender.ethPublicKey,
                recipientId: receiver.account.address
            }

            let admin;
            let admin1 = await User.find({ "role": "admin1" });
            if (receiver.role == "admin") {
                admin = receiver;
            }

            // let responseFromBlockchain = await axios.put(blockchain.baseUrl + blockchain.transfer, payload);
            result = await index.Transfer(admin1[0].ethPublicKey, admin1[0].ethPrivateKey, admin.ethPublicKey, transaction.coins);
            console.log("success : ", result.transactionHash);
            if (result.status) {
                let TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: transaction.coins,
                    senderWallet: admin1[0].account.address,
                    receiverWallet: admin.account.address,
                    transactionId: result.transactionHash
                });
                let newTRX = await TRX.save();

                let updatedTransaction = await Transaction.FindOneAndUpdate({ _id: req.params.id }, { $set: { status: req.body.status.toLowerCase(), transactionId: result.transactionHash } });
                if (updatedTransaction) {
                    chargesService.releaseConfirmTradeCharges(req.params.id);

                    return res.status(httpStatus.OK).send({ message: "transaction updated succesfully" });
                }
            } else {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Issue with blockchain", responseFromBlockchain });
            }
        }

        if (req.body.status.toLowerCase() === 'cancel' && sender.role == 'admin' && transaction.receiver && transaction.sender && transaction.receiver != 'undefined') {
            return res.status(httpStatus.BAD_REQUEST).send({ message: 'transaction can not cancelled' });
        }
        else if (req.body.status.toLowerCase() === 'paid') {

            // let response = await index.checkBal(sender.ethPublicKey);
            // console.log("sender : ", sender.email);
            // console.log("receiver : ", receiver.email);

            //calling admin charges sending service -----------------------    
            // let bal = await chargesService.getUserBalance(sender.id);

            // if (response < transaction.coins) {
            //     return res.status(httpStatus.BAD_REQUEST).send({ message: "Transaction cannot be done due to insufficient balance" });
            // }

            await Transaction.FindOneAndUpdate({ _id: req.params.id }, { $set: { status: req.body.status.toLowerCase(), picture: req.body.picture[0], amount: (req.body.coins / (10 ** 8)) } });
            return res.status(httpStatus.OK).send({ message: "Receipt uploaded successfully." });

        } else {
            console.log("last else hitting.");
            chargesService.releaseHoldTradeCharges(req.params.id);
            let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status.toLowerCase() });
            return res.status(httpStatus.OK).send({ message: "transaction updated succesfully2" });
        }

    } catch (error) {
        console.log("error during transaction to block chain in transaction.controller.js at 695");
        next(error)
    }
}

/**
 * Admin will confirm the disputed transactions
 */
exports.confirmTransaction = async (req, res, next) => {

    try {

        let user = req.user;
        let transaction = await Transaction.findById(req.params.id);
        console.log("Transaction details : ", transaction);
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
            chargesService.releaseHoldTradeCharges(transaction.id);
            let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status });
            return res.status(httpStatus.OK).send({ message: 'Transaction cancelled' });
        }

        // trigger blockchain to transfer coin
        if (req.body.status && req.body.status == 'confirm') {
            let coins = transaction.coins ? transaction.coins : req.body.coins;

            if (!transaction.sender || !transaction.receiver) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: 'One party is missing! Cannot change status' });
            }

            let result;
            let sender = await User.findById(transaction.sender);
            let receiver = await User.findById(transaction.receiver);
            let admin1 = await User.findOne({ role: 'admin1' });
            let adminfee = 0;

            if (transaction.sender && transaction.receiver) {
                //transferring trade coins from system to receiver
                result = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, receiver.ethPublicKey, coins);
                console.log(`${coins} Orogram transferred from ${admin1.email} to ${receiver.email} : `, result);

                let TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: coins,
                    senderWallet: admin1.account.address,
                    receiverWallet: receiver.account.address,
                    transactionId: result.transactionHash
                });
                let newTRX = await TRX.save();

                //transferring receivers holded coins
                const receiverHold = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, receiver.ethPublicKey, (coins * 0.04));
                console.log(`${(coins * 0.04)} Orogram transferred from system to ${receiver.email} : `, receiverHold);

                TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: (coins * 0.04),
                    senderWallet: admin1.account.address,
                    receiverWallet: receiver.account.address,
                    transactionId: receiverHold.transactionHash
                });
                newTRX = await TRX.save();


                //getting admin address ----------
                let admin = await User.findOne({ role: 'admin' });

                //transferring admin fees
                const adminCharge = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, admin.account.publicKey, (coins * 0.01));
                console.log(`${(coins * 0.01)} Orogram transferred to admin as a transaction fee : `, adminCharge);
                adminfee = coins * 0.01;
                TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: (coins * 0.01),
                    senderWallet: admin1.account.address,
                    receiverWallet: admin.account.address,
                    transactionId: adminCharge.transactionHash
                });
                newTRX = await TRX.save();
            }
            else {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Blockchain issue" });
            }


            if (result) {
                let updatedTransaction = await Transaction.findByIdAndUpdate(req.params.id, { status: req.body.status, blockchainId: result.transactionHash, transactionId: result.transactionHash, coins: coins, adminFee: adminfee });

                if (updatedTransaction) {
                    //Releasing holded funds from Admin. Updating wallet details as well ---------- 
                    await chargesService.releaseConfirmTradeCharges(req.params.id);
                    return res.status(httpStatus.OK).send({ message: "Transaction updated succesfully" });
                }
            } else {
                return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Issue with blockchain", responseFromBlockchain });
            }

        }

    } catch (error) {
        console.log(error, "Error during transaction to Blockchain");
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

        console.log("Search content check : ", req.query.searchString);
        if (req.query.searchString) {

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
        let transactions = await Transaction.find(queryObj['query']).sort({ 'createdAt': -1 });
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

        let queryObj = { 'query': {} };
        queryObj['query']['type'] = 'trade';

        //getting contract and contract date----------
        queryObj['query']['contractDate'];
        queryObj['query']['isContract'];

        queryObj.query['status'] = 'pending' || 'dispute';
        queryObj.query['lock'] = false;
        // queryObj.query['']
        if (req.query.country) {
            queryObj.query['country'] = req.query.country
        }
        if (req.query.currency) {
            queryObj.query['currency'] = req.query.currency
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
        //hiding self transactions here ------------------
        if (req.query.type == 'buy') {
            queryObj.query['receiver'] = null;
            queryObj.query['senderWallet'] = { $ne: req.user.account.address }
        }
        if (req.query.type == 'sell') {
            queryObj.query['sender'] = null;
            queryObj.query['receiverWallet'] = { $ne: req.user.account.address };
        }

        let count;
        Transaction.find(queryObj['query'], (err, result) => {
            if (result) {
                count = result.length;
            }
        })
        // queryObj['page'] = req.query.page ? parseInt(req.query.page) : 1;
        // queryObj['perPage'] = req.query.perPage ? parseInt(req.query.perPage) : 10;
        // let transactions = await Transaction.list(queryObj);
        let transactions = await Transaction.find(queryObj['query']).sort({ createdAt: -1 });
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
                type: { $in: ['btc', 'wire', 'cash', 'gold'] },
                transactionType: 'purchase'
            }
        }
        if (req.user.role == 'user') {
            queryObj['query']['receiver'] = req.user._id;
        }

        // ----- filters -----
        if (req.query.status) {
            queryObj['query']['status'] = req.query.status;
        }
        if (req.query.receiverId) {
            queryObj['query']['receiverId'] = req.query.receiverId;
        }
        if (req.query.type) {
            queryObj['query']['type'] = req.query.type;
            queryObj['query']['transactionType'] = 'purchase';
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
        let transactions = await Transaction.find(queryObj['query']).sort({ 'createdAt': -1 });
        transactions.forEach(element => {
            element['transactionType'] = 'purchase';
        });
        //console.log(transactions, "fpound ");

        res.json({ transactions, count });
    } catch (error) {
        next(error);
    }
}

//uploading Images of product --------------------------------------
exports.uploadFile = async (req, res, next) => {
    try {

        res.send(req.files);
        // console.log('files', req);

    } catch (error) {
        next(error);
    }
};

/**
 * get list of transactions of Admin ------------------
 * @public
 */
exports.getPurchaseCoinsAdmin = async (req, res, next) => {

    try {
        let queryObj = {};

        queryObj = {
            query: {
                type: { $in: ['btc', 'wire', 'cash', 'gold'] },
                transactionType: 'sell'
            }
        }

        if (req.user.role == 'user') {
            queryObj['query']['sender'] = req.user._id;
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
        queryObj['isAdminPurchase'] = true;
        queryObj['page'] = parseInt(req.query.page);
        queryObj['perPage'] = parseInt(req.query.perPage);
        let count;

        // console.log("query-----------", queryObj['query'])
        Transaction.find(queryObj['query'], (err, result) => {
            count = result.length
        })
        //console.log(queryObj, "query obj in controller");        
        let transactions = await Transaction.find(queryObj['query']).sort({ 'createdAt': -1 });
        transactions.forEach(element => {
            element['transactionType'] = 'sell';
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
        if (admin.role != 'admin1') {
            admin = await User.findOne({ role: 'admin' });
        }
        let coins = req.body.coins;
        let secret = admin.account.secret || cryptr.decrypt(admin.account.privateKey);
        let receiver = await User.find({ 'account.address': req.body.walletAddress });

        let payload = {
            secret: secret,
            amount: coins,
            publicKey: admin.account.publicKey,
            recipientId: req.body.walletAddress
        }

        // let accountBalance = await axios.get(blockchain.baseUrl + blockchain.getBalance + admin.account.address);
        let bal = await chargesService.getUserBalance(user.id);

        if (bal) {
            // if (accountBalance.data.balance < coins) {
            if (bal < coins) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: "Transaction cannot be done due to insufficient balance" });
            }
        } else {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Blockchain issue" });
        }

        // let response = await axios.put(blockchain.baseUrl + blockchain.transfer, payload);
        let response = await index.Transfer(admin.account.publicKey, admin.account.privateKey, receiver[0].ethPublicKey, coins);

        if (response.status) {
            transaction = new Transaction({
                type: 'coinTransfer',
                status: 'confirm',
                coins: coins,
                amount: coins,
                senderAccount: admin.account.address,
                senderWallet: admin.account.address,
                receiverAccount: req.body.walletAddress,
                receiverWallet: req.body.walletAddress,
                sender: admin._id,
                remarks: req.body.remarks || null,
                transactionId: response.transactionHash
            });
            console.log(transaction);

            if (receiver) {
                transaction['receiver'] = receiver._id;
            }
            let newTransaction = await transaction.save();

            let TRX = new blkTRX({
                type: 'coinTransfer',
                status: 'confirm',
                coins: coins,
                senderWallet: admin.account.address,
                receiverWallet: receiver[0].account.address,
                transactionId: response.transactionHash
            });
            let newTRX = await TRX.save();

            res.status(httpStatus.OK).send({ message: "Coin transfer request is created" });
        } else {
            res.status(httpStatus.OK).send({ message: "Issue with blockchain", responseFromBlockchain: response });
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
        let recipientUser = await User.findOne({ "account.address": req.body.walletAddress });

        let coins = req.body.coins / (10 ** 8);
        let secret = existUser.account.secret || getSecret(crypr.decrypt(existUser.ethPrivateKey));
        //console.log(secret, "secret");

        let payload = {
            secret: secret,
            amount: coins,
            publicKey: existUser.ethPublicKey,
            recipientId: req.body.walletAddress
        }

        // let accountBalance = await axios.get(blockchain.baseUrl + blockchain.getBalance + existUser.account.address);
        let accountBalance = await index.checkBal(existUser.ethPublicKey);
        let bal = await chargesService.getUserBalance(user.id);

        if (accountBalance) {
            if (bal.calculatedCoins < coins) {
                return res.status(httpStatus.BAD_REQUEST).send({ message: "Transaction cannot be done due to insufficient balance" });
            }
        } else {
            return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Blockchain issue" });
        }

        // let response = await axios.put(blockchain.baseUrl + blockchain.transfer, payload);
        let response = await index.Transfer(existUser.ethPublicKey, crypr.decrypt(existUser.ethPrivateKey), recipientUser.ethPublicKey, coins);

        if (response.status) {
            transaction = new Transaction({
                blockchainId: response.transactionHash,
                transactionId: response.transactionHash,
                type: 'directTransfer',
                status: 'confirm',
                coins: coins,
                senderAccount: existUser.account.address,
                senderWallet: existUser.account.address,
                receiverAccount: req.body.walletAddress,
                receiverWallet: req.body.walletAddress,
                sender: existUser._id,
                remarks: req.body.remarks || null
            });
            let receiver = await User.find({ 'account.address': req.body.walletAddress });
            if (receiver) {
                console.log("Received address : ", receiver[0]._id);
                transaction['receiver'] = receiver[0]._id;
            }
            let newTransaction = await transaction.save();

            let TRX = new blkTRX({
                type: 'directTransfer',
                status: 'confirm',
                coins: coins,
                senderWallet: existUser.account.address,
                receiverWallet: req.body.walletAddress,
                blockchainId: response.transactionHash,
            });
            let newTRX = await TRX.save();
            res.status(httpStatus.OK).send({ message: "Coin transfer request is created" });
        } else {
            res.status(httpStatus.OK).send({ message: "Issue with blockchain", responseFromBlockchain: response });
        }
    } catch (error) {
        next(error);
    }
}

// exports.getAdminTransactions = async (req, res, next) => {
//     try{
//         let admin = req.user;
//         //console.log(admin, "admin user found");

//         if(admin.role != 'admin' && admin.role != 'subAdmin' ) {
//             return res.send(httpStatus.UNAUTHORIZED).send({message: 'Unauthorized'});
//         }
//         console.log("user is admin");
//         console.log(blockchain.baseUrl + blockchain.getAdminTransactions + admin.account.address, "to be ihit");
//         let adminUser = await User.findOne({role: 'admin'});
//         let response = await axios.get(blockchain.baseUrl + blockchain.getAdminTransactions + adminUser.account.address + `&limit=${req.query.perPage}&offset=${req.query.page-1}`);
//         //console.log( response.data, "response from blockchain is admin");
//         console.log("RESPONSE",response.data);
//         if(response.data.success) {
//             return res.status(httpStatus.OK).send(response.data);
//         } else {
//             res.status(httpStatus.INTERNAL_SERVER_ERROR).send({message: "Incorrect blockchain response", response: response.data})
//         }
//     } catch (error) {

//     }
// }

exports.getAdminTransactions = async (req, res, next) => {
    try {
        let admin = req.user;

        if (admin.role != 'admin' && admin.role != 'subAdmin') {
            return res.send(httpStatus.UNAUTHORIZED).send({ message: 'Unauthorized' });
        }
        let adminUser = await User.findOne({ role: 'admin' });
        let queryObj = {};
        queryObj = {
            query: {
                $or: [{ type: "coinTransfer" }, { type: "directTransfer" }],
                $or: [{ senderAccount: adminUser.account.address }, { receiverAccount: adminUser.account.address }]
            }
        }
        queryObj['page'] = parseInt(req.query.page);
        queryObj['perPage'] = parseInt(req.query.perPage);
        let count;
        Transaction.find(queryObj['query'], (err, result) => {
            count = result.length
        })

        let transactions = await Transaction.list(queryObj);
        return res.status(httpStatus.OK).send({ count, transactions });

    } catch (error) {

    }
}

exports.getUserTransactions = async (req, res, next) => {

    try {
        let user = req.user;
        let all = await blkTRX.find({ $or: [{ senderWallet: user.account.address }, { receiverWallet: user.account.address }] });
        const data = all;
        count = data.length;

        res.status(httpStatus.OK).send({ count, data });
    } catch (error) {
        next(error)
    }
}


exports.getUserTransactions2 = async (req, res, next) => {

    try {
        let user = await User.find({ "_id": req.params.id });
        const address = user[0].account.address;
        let all = await blkTRX.find({ $or: [{ senderWallet: address }, { receiverWallet: address }] });
        let data = all;
        count = all.length;

        res.status(httpStatus.OK).send({ count, data });
    } catch (error) {
        next(error)
    }
}


async function getTimestamp(data) {
    // let transfersList = []
    let tId = []

    return new Promise(async (resolve, reject) => {
        data.transfers.forEach(async (transfer) => {
            tId.push(transfer.tid)
        });

        let transaction = await Transaction.find({ $or: [{ transactionId: { $in: tId } }, { blockchainId: { $in: tId } }] })
        // if (transaction.length > 0) {
        // }   else {
        // }

        data.transfers.forEach((transfer) => {
            let index = transaction.findIndex(trans => transfer.tid == trans.transactionId || transfer.tid == trans.blockchainId)
            if (index > -1) {
                let mydate = transaction[index].updatedAt
                // Date.parse('2019-05-15 07:11:10.673Z');
                let TS = mydate.getTime()
                transfer.timestamp = TS
            }
        })
        console.log("3333333333333", data.transfers.length)
        resolve(data.transfers)
    })
}

exports.getAccountCoinDetail = async (req, res, next) => {

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
        console.log(error, "error during getting user transaction in transaction.controller.js at line no. 1482");

        next(error);
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