var otpGenerator = require('otp-generator');
const moment = require('moment');

const User = require('../models/user.model');
const {generate} = require('../services/otpAuth');
exports.generateOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
	const otp = generate(email);
    return res.send({ otp });
  } catch (err) {
    return next(err);
  }
}