const httpStatus = require('http-status');
const axios = require('axios');
const Cryptr = require('cryptr');
const Transaction = require('../models/transactionsContract.model');
const blkTRX = require("../models/tx.model");
const HoldCoins = require('../models/holdBalance.model');
const trans = require('../models/transactions.model');
const HoldCoinsTrade = require('../models/holdBalanceTrade.model');
const User = require('../models/user.model');
const { blockchain, cryptrSecretKey } = require('../../config/vars');
const mongoose = require('mongoose');
const index = require('../../../../cryptogold-blockchain/src/index');

const crypr = new Cryptr(cryptrSecretKey);

module.exports.sendPersentagetoAdmin = async function SendPercentageAdmin(userid, trantype, coins) {
    // Calculating transaction percentage & sending money to admin account --------

    let secret;
    let percentage;

    let sender = await User.findById(userid);
    // let receiver = await User.findById(transaction.receiver);

    if (user.role == 'admin') {
        secret = user.account.secret;
    } else {
        secret = await getSecret(crypr.decrypt(sender.ethPrivateKey));
    }

    //step 1 :: calculate 2 for buy & 4% for sell  % -------
    if (trantype == 'sell') { percentage = 0.04; }
    if (trantype == 'buy') { percentage = 0.02; }

    let percentageAdmin = coins * percentage;

    console.log(percentageAdmin, "coins 2 % to send to admin :: Type" + typeof (percentageAdmin));

    //getting admin address ----------
    let admin = await User.findOne({ role: 'admin' });
    let adminAddress = admin.ethPublicKey;

    // admin transaction payload
    let payloadAdmin = {
        secret: secret,
        amount: parseInt(percentageAdmin),
        publicKey: sender.ethPublicKey,
        recipientId: adminAddress
    }

    //Sending percentage to admin  ----------------------------------------------------
    let pvt = crypr.decrypt(user.ethPrivateKey);
    let response = await index.Transfer(user.ethPublicKey, pvt, admin.ethPublicKey, percentageAdmin);
    console.log("Blockchain Response : ", response);

    if (response) {
        let TRX = new blkTRX({
            type: 'coinTransfer',
            status: 'holding',
            coins: percentageAdmin,
            senderWallet: user.account.address,
            receiverWallet: admin.account.address,
            transactionId: response.transactionHash
        });
        let newTRX = await TRX.save();
        return true;
    }
    else { return false; }

    function getSecret(secret) {
        var secretSplit = secret.split(" ");
        var newSecret = " ";
        for (let i = 0; i < 12; i++) {
            newSecret = newSecret + secretSplit[i] + " ";
        }
        return (newSecret.trim());
    }

}

module.exports.sendPersentagetoUser = async function SendPercentageUser(userid, trantype, coins) {
    // Calculating transaction percentage & sending money to admin account --------

    let secret;
    let percentage;

    let sender = await User.findById(userid);
    // // let receiver = await User.findById(transaction.receiver);

    // if(user.role == 'admin'){
    //     secret = user.account.secret;
    // } else {
    secret = await getSecret(crypr.decrypt(sender.ethPrivateKey));
    // }

    //step 1 :: calculate 2 for buy & 4% for sell  % -------
    if (trantype == 'sell') { percentage = 4; }
    if (trantype == 'buy') { percentage = 2; }

    let percentageAdmin = ((coins * percentage) / 100);

    console.log(percentageAdmin, "coins 2 % to send to admin :: Type" + typeof (percentageAdmin));

    //getting admin address ----------
    let admin = await User.findOne({ role: 'admin' });
    let adminAddress = admin.ethPublicKey;

    // admin transaction payload
    let payloadAdmin = {
        secret: secret,
        amount: parseInt(percentageAdmin),
        publicKey: adminAddress,
        recipientId: sender.account.publicKey
    }

    //Sending percentage to admin  ----------------------------------------------------
    let pvt = crypr.decrypt(user.ethPrivateKey);
    let response = await index.Transfer(user.ethPublicKey, pvt, admin.ethPublicKey, percentageAdmin);
    console.log("Blockchain Response : ", response);

    if (response.data.success) {
        TRX = new blkTRX({
            type: 'coinTransfer',
            status: 'holding',
            coins: percentageAdmin,
            senderWallet: user.account.address,
            receiverWallet: admin.account.address,
            transactionId: response.transactionHash
        });
        newTRX = await TRX.save();
        return true;
    }
    else { return false; }

    function getSecret(secret) {
        var secretSplit = secret.split(" ");
        var newSecret = " ";
        for (let i = 0; i < 12; i++) {
            newSecret = newSecret + secretSplit[i] + " ";
        }
        return (newSecret.trim());
    }

}

//Add coins to holding account ---------------------
module.exports.holdCharges = async function HoldCharges(modeoftran, tranId, userid, trantype, _coins) {

    let holdcoincount = await HoldCoins.count({});

    if (holdcoincount <= 0) {

        await new HoldCoins({

            holderUserId: null,
            holdedCoins: 0,
            transactionId: null,
            isHold: false

        }).save();
    }

    let percentage;
    let user = await User.findById(userid);
    let pvt = crypr.decrypt(user.ethPrivateKey);

    //geting total balance of coin of current user ---------
    let response = await index.checkBal(user.ethPublicKey);
    let admin = await User.findOne({ role: 'admin' });
    response = response * (10 ** 8);

    //calculating total holded coins till date -------
    // let totalholded = await trans.aggregate([{ $match: { receiverId: user.userId } }, { $group: { _id: '$receiverId', coins: { $sum: "$coins" } } }]);
    let totalholded = await HoldCoins.aggregate([{ $group: { _id: null, sum: { $sum: "$holdedCoins" } } }]);

    let allholded;

    if (totalholded.length > 0) {
        allholded = totalholded[0].sum;
    }
    else {
        allholded = 0;
    }

    //checking Total Holded coin greate than available balance ----
    let admin1 = await User.findOne({ role: 'admin1' });
    if (response > allholded) {

        if (modeoftran == 'creator') {
            if (trantype == 'sell') {

                percentage = 0.04;
                percentageAdmin = (_coins * percentage) / 10 ** 8;
                console.log("System 4% holded coins for this sell contract : ", percentageAdmin);
                let result = await index.Transfer(user.ethPublicKey, pvt, admin1.ethPublicKey, percentageAdmin);
                console.log("**********************************************");
                console.log("Transactin result : ", result);
                console.log("Holded coins transferred to system account for security.");
                let TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: percentageAdmin,
                    senderWallet: user.account.address,
                    receiverWallet: admin1.account.address,
                    transactionId: result.transactionHash
                });
                let newTRX = await TRX.save();

                let holdcoin = await new HoldCoins({

                    sellerUserId: userid,
                    holderUserId: userid,
                    sellerAddress: user.ethPublicKey,
                    holdedCoins: percentageAdmin,
                    sellerHoldedCoins: percentageAdmin,
                    transactionId: tranId,
                    isHold: true

                }).save()
                    .then(result => {
                        console.log("Seller holded coins recorded.", result);
                    });
            }

            if (trantype == 'buy') {

                percentage = 0.02;
                percentageAdmin = (_coins + (_coins * percentage)) / 10 ** 8;
                console.log("System 102% holded coins for this buy contract : ", percentageAdmin);
                let result = await index.Transfer(user.ethPublicKey, pvt, admin1.ethPublicKey, percentageAdmin);
                console.log("**********************************************");
                console.log("Transactin result : ", result);
                console.log("Holded coins transferred to system account for security.");
                let TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: percentageAdmin,
                    senderWallet: user.account.address,
                    receiverWallet: admin1.account.address,
                    transactionId: result.transactionHash
                });
                let newTRX = await TRX.save();

                let holdcoin = await new HoldCoins({

                    buyerUserId: userid,
                    holderUserId: userid,
                    buyerAddress: user.ethPublicKey,
                    holdedCoins: percentageAdmin,
                    buyerHoldedCoins: percentageAdmin,
                    transactionId: tranId,
                    isHold: true

                }).save()
                    .then(result => {
                        console.log("Buyer holded coins recorded.", result);
                    });
            }
        }

        if (modeoftran == 'accepter') {
            if (trantype == 'sell') {
                percentage = 0.04;
                percentageAdmin = (_coins * percentage) / 10 ** 8;
                console.log("System 4% holded coins for this sell contract : ", percentageAdmin);
                let result = await index.Transfer(user.ethPublicKey, pvt, admin1.ethPublicKey, percentageAdmin);
                console.log("**********************************************");
                console.log("Transactin result : ", result);
                console.log("Holded coins transferred to system account for security.");
                let TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: percentageAdmin,
                    senderWallet: user.account.address,
                    receiverWallet: admin1.account.address,
                    transactionId: result.transactionHash
                });
                let newTRX = await TRX.save();

                let accepter = await HoldCoins.findOne({ transactionId: tranId });

                if (accepter) {
                    accepter.sellerUserId = userid;
                    accepter.holderUserId = userid;
                    accepter.sellerAddress = user.ethPublicKey;
                    accepter.holdedCoins = percentageAdmin;
                    accepter.sellerHoldedCoins = percentageAdmin;

                    accepter.save()
                        .then(result => {
                            console.log("Seller holded coins recorded.", result);
                        });
                }
            }
            if (trantype == 'buy') {
                percentage = 0.02;
                percentageAdmin = (_coins + (_coins * percentage)) / 10 ** 8;
                console.log("System 102% holded coins for this buy contract : ", percentageAdmin);
                let result = await index.Transfer(user.ethPublicKey, pvt, admin1.ethPublicKey, percentageAdmin);
                console.log("**********************************************");
                console.log("Transactin result : ", result);
                console.log("Holded coins transferred to system account for security.");
                let TRX = new blkTRX({
                    type: 'coinTransfer',
                    status: 'holding',
                    coins: percentageAdmin,
                    senderWallet: user.account.address,
                    receiverWallet: admin1.account.address,
                    transactionId: result.transactionHash
                });
                let newTRX = await TRX.save();

                let accepter = await HoldCoins.findOne({ transactionId: tranId });

                if (accepter) {
                    accepter.buyerUserId = userid;
                    accepter.buyerUserId = userid;
                    accepter.buyerAddress = user.ethPublicKey;
                    accepter.holdedCoins = percentageAdmin;
                    accepter.buyerHoldedCoins = percentageAdmin;

                    accepter.save()
                        .then(result => {
                            console.log("Buyer holded coins recorded.", result);
                        });
                }
            }
        }

        // if (modeoftran == 'creator') {
        //     let holdcoin = await new HoldCoins({

        //         creatorUserId: userid,
        //         holderUserId : userid,
        //         creatorAddress: user.ethPublicKey,
        //         holdedCoins: percentageAdmin,
        //         creatorHoldedCoins: percentageAdmin,
        //         transactionId: tranId,
        //         isHold: true

        //     }).save()
        //         .then(result => {
        //             console.log("Seller holded coins recorded.", result);
        //         });
        // }

        // if (modeoftran == 'accepter') {
        //     let accepter = await HoldCoins.findOne({ transactionId: tranId });

        //     if (accepter) {
        //         accepter.accepterUserId = userid;
        //         accepter.holderUserId = userid;
        //         accepter.accepterAddress = user.ethPublicKey;
        //         accepter.holdedCoins = percentageAdmin;
        //         accepter.accepterHoldedCoins = percentageAdmin;

        //         accepter.save()
        //             .then(result => {
        //                 console.log("Buyer holded coins recorded.", result);
        //             });
        //     }
    }

    return true;
}

//Release coins from holded account ------------------
module.exports.releaseHoldCharges = async function ReleaseHoldCharges(tranId) {

    let holded = await HoldCoins.findOne({ transactionId: tranId });

    let holdtran;
    let seller = await User.findById(holded.sellerUserId);
    let buyer = await User.findById(holded.buyerUserId);
    let admin1 = await User.findOne({ role: 'admin1' });

    if (seller) {
        let sellerCoin = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, seller.ethPublicKey, holded.sellerHoldedCoins);
        holdtran = await HoldCoins.updateMany({ transactionId: tranId }, { $set: { sellerHoldedCoins: 0, holdedCoins: 0 } });

        if (holded.sellerHoldedCoins != 0) {
            let TRX = new blkTRX({
                type: 'coinTransfer',
                status: 'cancel',
                coins: holded.sellerHoldedCoins,
                senderWallet: admin1.account.address,
                receiverWallet: seller.account.address,
                transactionId: sellerCoin.transactionHash
            });
            let newTRX = await TRX.save();

            let trans = await Transaction.findByIdAndUpdate(tranId, { transactionId: sellerCoin.transactionHash, status: 'cancel' });
        }
    }

    if (buyer) {
        let buyerCoin = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, buyer.ethPublicKey, holded.buyerHoldedCoins);
        holdtran = await HoldCoins.updateMany({ transactionId: tranId }, { $set: { buyerHoldedCoins: 0, holdedCoins: 0 } });

        if (holded.buyerHoldedCoins != 0) {
            TRX = new blkTRX({
                type: 'coinTransfer',
                status: 'cancel',
                coins: holded.buyerHoldedCoins,
                senderWallet: admin1.account.address,
                receiverWallet: buyer.account.address,
                transactionId: buyerCoin.transactionHash
            });
            newTRX = await TRX.save();

            let trans = await Transaction.findByIdAndUpdate(tranId, { transactionId: buyerCoin.transactionHash, status: 'cancel' });
        }

    }

    // let holdtran = await HoldCoins.updateMany({ transactionId: tranId }, { $set: { sellerHoldedCoins: 0, buyerHoldedCoins: 0, holderUserId: 0, holdedCoins: 0 } });

    if (holdtran != null) {
        return true;
    }
    else {
        console.log("No transaction found");
        return false;
    }
}

//Release confirm contract holded coins
module.exports.releaseConfirmHoldCharges = async function ReleaseConfirmHoldCharges(tranId) {

    let holdtran = await HoldCoins.updateMany({ transactionId: tranId }, { $set: { buyerHoldedCoins: 0, sellerHoldedCoins: 0, holdedCoins: 0 } });

    if (holdtran != null) {
        return true;
    }
    else {
        console.log("No transaction found");
        return false;
    }
}

//Calculate Total bal & Holded Bal & calculate response---------------------
module.exports.getUserBalance = async function GetUserBalance(userid) {

    try {

        let user = await User.findById(userid);
        let response;

        //geting total balance of coin of current user ---------
        if (user.role == 'admin') {
            response = await index.checkBal(user.account.publicKey);
        } else {
            response = await index.checkBal(user.ethPublicKey);
        }

        let acceptHold = 0;
        let createHold = 0;
        let test = await HoldCoinsTrade.find({ creatorId: userid });
        console.log(test.length);
        if (test) {
            for (let i = 0; i < test.length; i++) {
                createHold = createHold + test[i].creatorHoldedCoins;
            }
        }

        let test1 = await HoldCoinsTrade.find({ accepterId: userid });
        console.log(test1.length);
        if (test1) {
            for (let i = 0; i < test1.length; i++) {
                acceptHold = acceptHold + test1[i].accepterHoldedCoins;
            }
        }

        let tradeHold = createHold + acceptHold;
        console.log("Totel holded coins of trades : ", tradeHold);

        //calculating total holded coins till date -------
        let sellerContractHold = 0;
        let buyerContractHold = 0;
        let sum1 = await HoldCoins.find({ sellerUserId: userid });
        if (sum1) {
            for (let i = 0; i < sum1.length; i++) {
                sellerContractHold = sellerContractHold + sum1[i].sellerHoldedCoins;
            }
            console.log("sell contract holded coins : ", sellerContractHold);
        }
        let sum2 = await HoldCoins.find({ buyerUserId: userid });
        if (sum2) {
            for (let i = 0; i < sum2.length; i++) {
                buyerContractHold = buyerContractHold + sum2[i].buyerHoldedCoins;
            }
            console.log("buy contract holded coins : ", buyerContractHold);
        }

        let contractHold = sellerContractHold + buyerContractHold;
        console.log("Contract holded coins : ", contractHold);

        // let totalholded = await HoldCoins.aggregate([{$match: {"holderUserId": userid}},{$group:{ _id: null, sum: { $sum: "$holdedCoins" }}}]);
        // console.log("^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^");
        // console.log("Totel holded coins of contracts : ", totalholded);

        if (contractHold > 0) {

            if (tradeHold > 0) {

                let allholded = contractHold + tradeHold;
                let actualCoins = response;
                let totalCoins = response + allholded;

                return { holdedCoins: allholded, calculatedCoins: actualCoins, totalCoins: totalCoins };

            } else {

                let allholded = contractHold;
                let actualCoins = response;
                let totalCoins = response + allholded;

                return { holdedCoins: allholded, calculatedCoins: actualCoins, totalCoins: totalCoins };

            }
        }
        else {

            if (tradeHold > 0) {

                let allholded = tradeHold;
                let actualCoins = response;
                let totalCoins = response + allholded;

                return { holdedCoins: allholded, calculatedCoins: actualCoins, totalCoins: totalCoins };

            } else {

                let allholded = 0;
                let tradeholded = 0;
                let actualCoins = response;
                let totalCoins = response + allholded;

                return { holdedCoins: allholded, calculatedCoins: actualCoins, totalCoins: totalCoins };
            }
        }
    } catch (error) {
        console.log(error);
    }

}

//Add coins to holding account ---------------------
module.exports.holdChargesTrade = async function HoldChargesTrade(modeoftran, tranId, userid, trantype, coins) {

    let coin = coins / (10 ** 8);
    let holdcoincount = await HoldCoinsTrade.count({});

    if (holdcoincount <= 0) {
        // adding dummy data 1 st time 
        await new HoldCoinsTrade({
            holderUserId: null,
            creatorId: null,
            accepterId: null,
            creatorHoldedCoins: 0,
            accepterHoldedCoins: 0,
            holdedCoins: 0,
            transactionId: 0,
            isHold: false
        }).save();
    }

    //user who initiates trade transaction
    let user = await User.findById(userid);
    let pvt = crypr.decrypt(user.ethPrivateKey);

    //geting total balance of coin of current user ---------
    let response = await index.checkBal(user.ethPublicKey);

    //system account details
    let admin1 = await User.findOne({ 'role': 'admin1' });

    //calculating total holded coins till date -------
    let totalholdedTrade = await HoldCoinsTrade.aggregate([{ $group: { _id: null, sum: { $sum: "$holdedCoins" } } }]);
    let totalholded = await HoldCoins.aggregate([{ $group: { _id: null, sum: { $sum: "$holdedCoins" } } }]);

    //creator | accepter

    let percentageAdmin;
    if (modeoftran == 'creator') {

        //step 1 :: calculate 101% for sell & 4% for buy  % -------
        if (trantype == 'sell') {
            percentage = 0.01;
            percentageAdmin = coin + (coin * percentage);
            console.log("percentageAdmin in sell trade : ", percentageAdmin);
        }
        if (trantype == 'buy') {
            percentage = 0.04;
            percentageAdmin = (coin * percentage);
            console.log("percentageAdmin in buy trade : ", percentageAdmin); ``
        }

        //save holded coins in history
        let holdcointrade = await new HoldCoinsTrade({
            holderUserId: userid,
            creatorId: userid,
            creatorHoldedCoins: percentageAdmin,
            holdedCoins: percentageAdmin,
            transactionId: tranId,
            isHold: true
        }).save()
            .then(result => {
                console.log("Saved creator trade details : ", result._doc);
            })
            .catch(err => {
                console.log(err);
            });

        //collect security coins from user into system account
        let holdedCoins = await index.Transfer(user.ethPublicKey, pvt, admin1.ethPublicKey, percentageAdmin);
        console.log("Trade holded coins transferred from creator to system account : ", holdedCoins);
        let TRX = new blkTRX({
            type: 'coinTransfer',
            status: 'holding',
            coins: percentageAdmin,
            senderWallet: user.account.address,
            receiverWallet: admin1.account.address,
            transactionId: holdedCoins.transactionHash
        });
        let newTRX = await TRX.save();

    }

    if (modeoftran == 'accepter') {

        if (trantype == 'sell') {
            percentage = 0.01;
            percentageAdmin = coins + (coins * percentage);
            console.log("percentageAdmin : ", percentageAdmin);
        }
        if (trantype == 'buy') {
            percentage = 0.04;
            percentageAdmin = (coins * percentage);
            console.log("percentageAdmin : ", percentageAdmin);
        }

        //save system holded coins in history
        let holdcointrade = await HoldCoinsTrade.findOne({ transactionId: tranId });

        if (holdcointrade) {
            holdcointrade.accepterId = userid;
            holdcointrade.accepterHoldedCoins = percentageAdmin;
            holdcointrade.save()
                .then(result => {
                    console.log("Accepter holded coins recorded.", result);
                });
        }

        //collect security coins from user into system account
        let holdedCoins = await index.Transfer(user.ethPublicKey, pvt, admin1.ethPublicKey, percentageAdmin);
        console.log("Trade holded coins transferred from acceptor to system account : ", holdedCoins);
        let TRX = new blkTRX({
            type: 'coinTransfer',
            status: 'holding',
            coins: percentageAdmin,
            senderWallet: user.account.address,
            receiverWallet: admin1.account.address,
            transactionId: holdedCoins.transactionHash
        });
        let newTRX = await TRX.save();

    }

    if (trantype == "adminsell") {

        percentage = 1;
        coin = coin * (10 ** 8);
        percentageAdmin = coin * percentage;

        let holdcointrade = await new HoldCoinsTrade({
            holderUserId: userid,
            creatorId: userid,
            creatorHoldedCoins: percentageAdmin,
            holdedCoins: percentageAdmin,
            transactionId: tranId,
            isHold: true
        }).save()
            .then(result => {
                console.log("Saved sell to admin trade details : ", result._doc);
            })
            .catch(err => {
                console.log(err);
            });

        //collect security coins from user into system account
        let holdedCoins = await index.Transfer(user.ethPublicKey, pvt, admin1.ethPublicKey, percentageAdmin);
        console.log("Sell to admin coin with percentageAdmin to system account : ", holdedCoins);
        let TRX = new blkTRX({
            type: 'coinTransfer',
            status: 'holding',
            coins: percentageAdmin,
            senderWallet: user.account.address,
            receiverWallet: admin1.account.address,
            transactionId: holdedCoins.transactionHash
        });
        let newTRX = await TRX.save();
    }

    return true;
}


//Release coins from holded account ------------------
module.exports.releaseHoldTradeCharges = async function releaseHoldTradeCharges(tranId) {

    let holdedTrade = await HoldCoinsTrade.findOne({ transactionId: tranId });

    let creator = await User.findById(holdedTrade.creatorId);
    let accepter = await User.findById(holdedTrade.accepterId);
    let admin1 = await User.findOne({ role: 'admin1' });

    let creatorCoin = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, creator.ethPublicKey, holdedTrade.creatorHoldedCoins);
    let holdtran = await HoldCoinsTrade.updateMany({ transactionId: tranId }, { $set: { creatorHoldedCoins: 0, holdedCoins: 0 } });

    if (holdedTrade.creatorHoldedCoins != 0) {
        let TRX = new blkTRX({
            type: 'coinTransfer',
            status: 'cancel',
            coins: holdedTrade.creatorHoldedCoins,
            senderWallet: admin1.account.address,
            receiverWallet: creator.account.address,
            transactionId: creatorCoin.transactionHash
        });
        let newTRX = await TRX.save();
    }

    let accepterCoin = await index.Transfer(admin1.ethPublicKey, admin1.ethPrivateKey, accepter.ethPublicKey, holdedTrade.accepterHoldedCoins);
    holdtran = await HoldCoinsTrade.updateMany({ transactionId: tranId }, { $set: { holdedCoins: 0, accepterHoldedCoins: 0 } });

    if (holdedTrade.accepterHoldedCoins != 0) {
        TRX = new blkTRX({
            type: 'coinTransfer',
            status: 'cancel',
            coins: holdedTrade.accepterHoldedCoins,
            senderWallet: admin1.account.address,
            receiverWallet: accepter.account.address,
            transactionId: accepterCoin.transactionHash
        });
        newTRX = await TRX.save();
    }

    if (holdtran != null) {

        return true;
    }
    else {
        console.log("No transaction found");
        return false;
    }
}


//Release coins from holded account ------------------
module.exports.releaseConfirmTradeCharges = async function releaseConfirmTradeCharges(tranId) {

    let holdtran = await HoldCoinsTrade.updateMany({ transactionId: tranId }, { $set: { creatorHoldedCoins: 0, holdedCoins: 0, accepterHoldedCoins: 0 } });
    console.log("Creator hold coins status : ", holdtran);

    if (holdtran != null) {

        return true;
    }
    else {
        console.log("No transaction found");
        return false;
    }
}



module.exports.getTotalAdminHoldBalance = async function getTotalAdminHoldBalance() {

    try {

        //calculating contract total holded coins till date -------

        let totalholded = await HoldCoins.aggregate([
            {
                $group: {
                    _id: '',
                    holdedCoins: { $sum: '$holdedCoins' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalholded: '$holdedCoins'
                }
            }
        ]);

        //calculating trade total holded coins till date -------

        let totalholdedTrade = await HoldCoinsTrade.aggregate([
            {
                $group: {
                    _id: '',
                    holdedCoins: { $sum: '$holdedCoins' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalholdedTrade: '$holdedCoins'
                }
            }
        ]);

        //checking Total Holded coin greate than available balance ----
        console.log("AdtotalholdedTrade", totalholdedTrade);
        console.log("Adtotalholded", totalholded);

        return { totalTradeHolded: totalholdedTrade, totalContractHolded: totalholded, totalAdminHolded: (totalholdedTrade?.[0].totalholdedTrade + totalholded?.[0].totalholded) }


    } catch (error) {
        console.log(error);
    }

}

//hold charge for sell bitoro to admin
module.exports.holdChargeSell = async function HoldChargeSell(tranId, userid, coins) {

}