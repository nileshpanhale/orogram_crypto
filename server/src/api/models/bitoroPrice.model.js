const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    goldprice : String,
    btcprice : Number,
    bitorobtc : Number
})

module.exports = ("BitoroRate", schema);