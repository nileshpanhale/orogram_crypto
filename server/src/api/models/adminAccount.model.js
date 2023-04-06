const mongoose = require('mongoose');

/**
 * Admin Account Info
 * @private
 */
const adminAccountSchema = new mongoose.Schema({
  email:{
    type: String,
    match: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
    unique: true
  },
  btcWalletAddress: {
    type: String
  },
  accountName: {
    type: String
  },
  accountNumber: {
    type: String
  },
  accountIfsc: {
    type: String
  },
  accountSwift: {
    type: String
  },
  accountAddress: {
    type: String
  },
  role: {
    type : String
  }
}, {
  timestamps: true,
});

adminAccountSchema.statics = {
  
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
const AdminAccount = mongoose.model('AdminAccount', adminAccountSchema);
module.exports = AdminAccount;
