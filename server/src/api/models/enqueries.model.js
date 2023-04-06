const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');

/**
 * Refresh Token Schema
 * @private
 */
const enquerySchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  enquery: {
    type: String,
    required: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  }
});

/**
 * @typedef RefreshToken
 */
const Enquery = mongoose.model('Enquery', enquerySchema);
module.exports = Enquery;
