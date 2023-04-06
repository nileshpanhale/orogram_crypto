const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');

/**
 * Refresh Token Schema
 * @private
 */
const wireTransferSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  accountNumber: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
  }
}, {
  timestamps: true,
});

wireTransferSchema.statics = {
  async get(id) {
    try {
      let wireTransfer;

      if (mongoose.Types.ObjectId.isValid(id)) {
        wireTransfer = await this.findById(id).exec();
      }
      if (wireTransfer) {
        return wireTransfer;
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
   * List wire transfers in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of transfers to be skipped.
   * @param {number} limit - Limit number of transfers to be returned.
   * @returns {Promise<User[]>}
   */
  list({
    page = 1,
    perPage = 30,
    query,
  }) {
    return this.find(query)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

  async FindOneAndUpdate(query, update) {
    try {
      const transfer = await this.findOneAndUpdate(query, update).exec();
      if(transfer) {
        return transfer
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
      const transfer = await this.findOne(query).exec();

      if(transfer) {
        return transfer
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
const WireTransfer = mongoose.model('WireTransfer', wireTransferSchema);
module.exports = WireTransfer;
