const mongoose = require('mongoose');


/**
 * holdBalSchema Schema
 * @private
 */
const holdBalTradeSchema = new mongoose.Schema({

  holderUserId: {
    type: String
  },
  holderAddress: {
    type: String
  },
  creatorId : {
    type: String
  },
  accepterId : {
    type: String
  },
  creatorHoldedCoins: {
    type: Number
  },
  accepterHoldedCoins: {
    type: Number
  },
  holdedCoins: {
    type: Number
  },
  totalCoins: {
    type: Number
  },
  remainCoins: {
    type: Number
  },
  transactionId: {
    type: String
  },
  isHold: {
    type: Boolean
  }
});

holdBalTradeSchema.index({ holderAddress: 'text', holderUserId: 'text' });

holdBalTradeSchema.statics = {
  async get(id) {
    try {
      let holdebal;

      if (mongoose.Types.ObjectId.isValid(id)) {
        holdebal = await this.findById(id).exec();
      }
      if (holdebal) {
        return holdebal;
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
      if (updatedTransaction) {
        return updatedTransaction
      }

      throw new APIError({
        message: 'holdebal does not exists',
        status: httpStatus.NOT_FOUND,
      });
    } catch (err) {
      throw new APIError({
        message: 'holdebal does not exist',
        status: httpStatus.BAD_REQUEST,
      });
    }
  },


}

module.exports = mongoose.model('HoldedTradeBalance', holdBalTradeSchema);
