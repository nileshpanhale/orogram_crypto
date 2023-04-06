const mongoose = require('mongoose');
var generator = require('generate-password');
const APIError = require('../utils/APIError');

/**
 * AdminTransaction Schema
 * @private
 */
const adminTransactionSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    unique: true,
  },
  date: {
    type: String,
    minlength: 6,
  },
  transactionType: {
    type: String,
    trim: true,
  },
  noOfCoins: {
    type: String,
    trim: true,
  },
  createWithoutPassword:{
    type:boolean,
    default :true
  }
},{
    timestamps: true,
});

/**
 * Methods
 */
adminTransactionSchema.method({
  transform() {
    const transformed = {};
    const fields = ['walletAddress'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  password(){
    var password = generator.generate({
      length: 10,
      numbers: true
  });
  console.log(password);
  }
});

/**
 * @typedef AdminTransaction
 */
module.exports = mongoose.model('AdminTransaction', adminTransactionSchema);
