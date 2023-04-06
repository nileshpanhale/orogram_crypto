const mongoose = require('mongoose');


/**
 * holdBalSchema Schema
 * @private
 */
const holdBalSchema = new mongoose.Schema({

  sellerUserId: {
    type: String
  },
  holderUserId: {
    type : String
  },
  sellerAddress: {
    type: String
  },
  sellerHoldedCoins: {
    type: Number
  },
  buyerUserId: {
    type: String
  },
  buyerAddress: {
    type: String
  },
  buyerHoldedCoins: {
    type: Number
  },
  holderAddress: {
    type: String
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

holdBalSchema.index({ holderAddress: 'text', holderUserId: 'text' });

holdBalSchema.statics = {
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

module.exports = mongoose.model('HoldedBalance', holdBalSchema);
