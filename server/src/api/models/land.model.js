const mongoose = require('mongoose');
const httpStatus = require('http-status');

/**
 * Land Details Schema
 * @private
 */
const landSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now
    },
    owner: {
        type: String
    },
    coordinates: {
        type: Array
    },
    nftID: {
        type: Number
    },
    area : {
        type : String
    }
});

module.exports = mongoose.model("landNFT", landSchema);