const express = require('express');
const route = express.Router();
const index = require('./index');
const mongoose = require('mongoose');


route.get('/name', async function (req, res) {
    const tokenName = await index.name();
    res.status(200).json({
        data: {
            "msg": "Token name fetched successfully",
            "name": `${tokenName}`,
            "status": 200
        }
    });
});

route.get('/symbol', async function (req, res) {
    const symbol = await index.symbol();
    res.status(200).json({
        data: {
            "msg": "Symbol fetched successfully",
            "symbol": `${symbol}`,
            "status": 200
        }
    });
});

route.get('/totalSupply', async function (req, res) {
    const total = await index.totalSupply();
    res.status(200).json({
        data: {
            "msg": "Supply fetched successfully",
            "supply": `${total}`,
            "status": 200
        }
    });
})

route.get('/balance', async function (req, res) {
    try {
        const balance = await index.checkBal(req.params.account);
        res.status(200).json({
            data: {
                "msg": "Balance fetched successfully",
                "balance": `${balance}`,
                "status": 200
            }
        });
    } catch (e) {
        console.log(e);
    }
})

route.post('/send', async function (req, res) {
    console.log("Transfer function body : ", req.body);
    try {
        const sender = req.body.sendFrom;
        const secret = req.body.privateKey;
        const receiver = req.body.receiver;
        const amt = req.body.amount;
        try {
            await index.Transfer(sender, secret, receiver, amt);

            let TRX = new trans({
                _id: new mongoose.Types.ObjectId,
                sender: sender,
                receiver: receiver,
                amount: amt,
                time: Date.now(),
                status: "transfer"
            });
            TRX.save().then(result => {
                console.log(result);
            });

            res.status(200).json({
                data: {
                    "msg": `${amt} DNAR sent successfully from ${sender} to ${receiver}.`,
                    "status": 200
                }
            });
        }
        catch (err) {
            console.error(err);
            res.status(500).json({
                data: {
                    "msg": "Transaction failed.",
                    "status": 500
                }
            });
        }
    } catch (e) {
        console.log(e);
    }
})

route.post('/xfer', async function (req, res) {
    try {
        const sender = req.body.sendFrom;
        const secret = req.body.privateKey;
        const receiver = req.body.receiver;


        //%fees
        let devp = (1.6666666667 / 100);
        let own = (3.75 / 100);

        const minter = await index.minterStatus(sender);
        console.log("Address approved as minter : ", minter);

        if (sender == support.address1) {
            let devs, owns = 0;
            let amt = req.body.amount * (10 ** 6);

            try {
                await index.mint(receiver, amt);
            } catch (e) {
                console.log(e);
            }

            devs = Math.trunc((amt * devp));
            owns = Math.trunc((amt * own));

            try {
                setTimeout(async function () {
                    await index.vest(devs, owns);
                }, 3000);
                console.log("Token vesting completed with referral.");
                res.status(200).json({
                    data: {
                        "msg": `${req.body.amount} DNAR has been successfully transferred.`,
                        "status": 200
                    }
                })
            } catch (e) {
                console.log("Error while vesting in user referral verification : ");
                console.log(e);
            }
        } else {
            res.status(500).json({
                data: {
                    "msg": "Unauthorized account.",
                    "status": 500
                }
            });
        }
    } catch (e) {
        console.log(e);
    }
});

module.exports = route;