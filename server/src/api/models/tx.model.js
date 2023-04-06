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
  senderAccount: {
    type: String
  },
  senderId: {
    type: String
  },
  receiverAccount: {
    type: String
  },
  receiverId: {
    type: String
  },
  amount: {
    type: Number
  },
  coins: {
    type: Number
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    default: null
  },
  senderWallet: {
    type: String
  },
  traderAccountDetails:Object,
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    index: true,
    default: null
  },
  receiverWallet: {
    type: String
  },
  type: {
    type: String,
    enum: ['trade', 'coinTransfer', 'btc', 'wire','directTransfer','cash', 'gold'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'dispute', 'confirm', 'cancel', 'pause', 'restart', 'holding'],
    default: 'pending',
    required: true
  },
  transactionId:{
    type:String
  }
}, {
  timestamps: true,
});

transactionSchema.index({senderWallet: 'text', receiverWallet: 'text', senderAccount: 'text', receiverAccount: 'text', status: 'text'});

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
      console.log(query, update, "inside model");
      const updatedTransaction = await this.findOneAndUpdate(query, update).exec();
      if(updatedTransaction) {
        return updatedTransaction
      }

      throw new APIError({
        message: 'transaction does not exists',
        status: httpStatus.NOT_FOUND,
      });
    } catch(err) {
      throw new APIError({
        message: 'transaction does not exist',
        status: httpStatus.BAD_REQUEST,
      });
    }
  },

  async FindOne(query) {
    try {
      const transaction = await this.findOne(query).exec();

      if(transaction) {
        return transaction
      }

      throw new APIError({
        message: 'transaction does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch(err) {
      throw new APIError({
        message: 'transaction does not exist',
        status: httpStatus.BAD_REQUEST,
      });
    }
  },

}

module.exports = mongoose.model('tx', transactionSchema);
