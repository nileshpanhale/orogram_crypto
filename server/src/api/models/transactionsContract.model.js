const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');
const APIError = require('../utils/APIError');
const httpStatus = require('http-status');

/**
 * Transaction Schema
 * @private
 */
const transactionSchema = new mongoose.Schema({
  _id: { type: String },
  senderAccount: {
    type: String
  },
  receiverAccount: {
    type: String
  },
  receiverId: {
    type: String
  },
  country: {
    type: String
  },
  amount: {
    type: Number
  },
  coins: {
    type: Number
  },
  currency: {
    type: String
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    default: null
  },
  senderWallet: {
    type: String
  },
  traderAccountDetails: Object,
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    default: null
  },
  receiverWallet: {
    type: String
  },
  creator: {
    type: String
  },
  creatorEmail: {
    type: String
  },
  type: {
    type: String,
    enum: ['trade', 'coinTransfer', 'btc', 'wire', 'directTransfer'],
    required: true
  },
  tradeType: {
    type: String,
    enum: ['wallet', 'bank'],
  },
  status: {
    type: String,
    enum: ['pending', 'dispute', 'confirm', 'cancel', 'pause', 'restart', 'paid'],
    default: 'pending',
    required: true
  },
  requested: {
    type: Boolean,
  },
  blockchainId: {
    type: String
  },
  contractDate: {
    type: Number,
    default: 0
  },
  contractDays: {
    type: Number,
    default: 0
  },
  isContract: {//
    type: Boolean,
    default: false
  },
  isClosedContract: {//isClosedContract
    type: Boolean,
    default: false
  },
  contractUserEmail: {//closed contract user
    type: String
  },
  contractHash: {
    type: String
  },
  contractStatus: [{
    contractHash: String,
    contractStatus: String
  }],
  lock: {
    type: Boolean,
    default: false
  },
  remarks: {
    type: String
  },
  picture: [{}],
  pictureReciever: [{}],
  picturePaid: [{}],
  addressReciever: {
    type: String
  },
  remarksReciever: {
    type: String
  },
  nameReciever: {
    type: String
  },
  contactReciever: {
    type: String
  },
  bankAccount: {
    name: String,
    number: String,
    swift: String,
    country: String,
    city: String,
    beneficiary: String,
    currency: String
  },
  transactionId: {
    type: String
  },
  transactionType: {
    type: String
  },
  adminFee: {
    type: Number
  },
  disputedBy: {
    type: String
  }
}, {
  timestamps: true,
});

transactionSchema.index({ senderWallet: 'text', receiverWallet: 'text', senderAccount: 'text', receiverAccount: 'text', status: 'text' });

transactionSchema.statics = {
  async get(id) {
    try {
      let transaction;

      if (mongoose.Types.ObjectId.isValid(id)) {
        transaction = await this.findById(id).exec();
      }
      if (transaction) {
        return transaction;
      }

      throw new APIError({
        message: 'User does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * List transactions in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of transactions to be skipped.
   * @param {number} limit - Limit number of transactions to be returned.
   * @returns {Promise<User[]>}
   */
  list({
    page = 1,
    perPage = 30,
    query,
  }) {
    console.log(query, "query inside model");
    return this.find(query)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .lean()
      .exec();
  },

  async FindOneAndUpdate(query, update) {
    try {
      const updatedTransaction = await this.findOneAndUpdate(query, update).exec();
      if (updatedTransaction) {
        return updatedTransaction
      }

      throw new APIError({
        message: 'transaction does not exists',
        status: httpStatus.NOT_FOUND,
      });
    } catch (err) {
      throw new APIError({
        message: 'transaction does not exist',
        status: httpStatus.BAD_REQUEST,
      });
    }
  },

  async FindOne(query) {
    try {
      const transaction = await this.findOne(query).exec();

      if (transaction) {
        return transaction
      }

      throw new APIError({
        message: 'transaction does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch (err) {
      throw new APIError({
        message: 'transaction does not exist',
        status: httpStatus.BAD_REQUEST,
      });
    }
  },

}

module.exports = mongoose.model('TransactionContract', transactionSchema);
