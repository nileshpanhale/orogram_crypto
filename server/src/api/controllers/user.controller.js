const httpStatus = require('http-status');
const { omit } = require('lodash');
const User = require('../models/user.model');
const AdminAccount = require('../models/adminAccount.model');
const trans = require('../models/transactions.model')

const { handler: errorHandler } = require('../middlewares/error');
const bcrypt = require('bcryptjs');

const OTP = require('otp.js');
const axios = require('axios');
const { twoStepVerification, blockchain } = require('../../config/vars');
const { googleAuth } = require('../../config/vars');
const chargesService = require('../services/chargesTranceferService');
const Transaction = require('ethereumjs-tx');
const index = require('../../../../cryptogold-blockchain/src/index');

// get GoogleAuthenticator object
const GA = OTP.googleAuthenticator;

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const user = await User.get(id);
    req.locals = { user };
    return next();
  } catch (error) {
    return errorHandler(error, req, res);
  }
};

/**
 * Get user
 * @public
 */
exports.get = (req, res) => res.json(req.locals.user.transform());

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.user.transform());


/**
 * Create new user
 * @public
 */
exports.create = async (req, res, next) => {
  try {

    const user = new User(req.body);
    const savedUser = await user.save();
    res.status(httpStatus.CREATED);
    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (req, res, next) => {
  try {

    const { user } = req.locals;
    const newUser = new User(req.body);
    const ommitRole = user.role !== 'admin' ? 'role' : '';
    const newUserObject = omit(newUser.toObject(), '_id', ommitRole);
    await user.update(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    res.json(savedUser.transform());
  } catch (error) {
    next(User.checkDuplicateEmail(error));
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = async (req, res, next) => {
  const query = req.body.query;
  const update = { $set: req.body.update };
  try {

    let notAllowedFields = ['email', 'password', 'account'];
    notAllowedFields.forEach(field => {
      delete req.body[field];
    });

    let user = await User.findByIdAndUpdate(req.user._id, { $set: req.body }, { new: true });
    if (user) {
      user = user.transform();
      return res.status(httpStatus.OK).send({ message: 'user updated', user });
    }
  } catch (err) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send(err);
    next(err);
  }
};

/**
 * Update existing user
 * @public
 */
exports.updateUser = async (req, res, next) => {
  try {

    let userfindQuery = req.params['userId'] ? req.params['userId'] : req.user._id;;
    const user = await User.findByIdAndUpdate(userfindQuery, { $set: req.body }).exec();

    if (user && user.role == 'admin') {
      await AdminAccount.findOneAndUpdate({ role: 'admin' }, { email: req.body.email })
    }

    if (user) return res.status(httpStatus.OK).send({ message: 'user updated' });

    res.status(httpStatus.FORBIDDEN).send('error!');
  } catch (err) {
    console.log(err, "errorrrr");
    next(err);
  }
};

/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {

    if (req.user.role != 'admin' && req.user.role != 'subAdmin') {
      return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
    }
    let count;
    // await User.find({}, (err, result) => {
    //   if (result) {
    //     console.log("Users list : ", result);
    //     count = result.length;
    //   }
    //   else {
    //     console.log(err)
    //   }
    // });
    const users = await User.list(req.query);
    const transformedUsers = users.map(user => user.transform());
    
    res.send({ count, transformedUsers });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = async (req, res, next) => {
  try {

    let user = req.user;
    let updatedUser = await User.findByIdAndUpdate(user._id, { isActive: false });
    if (updatedUser) {
      return res.status(httpStatus.OK).send({ message: "User successfully deactivated" });
    }

    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "Something went wrong." });
  } catch (error) {
    return res.send(httpStatus.INTERNAL_SERVER_ERROR).send(error);
  }
};


exports.updatePassword = async (req, res, next) => {
  try {
    let user = req.user;
    const { oldPassword, password, confirmPassword } = req.body;

    if (!await user.passwordMatches(oldPassword)) {
      return res.status(httpStatus.BAD_REQUEST).send({ message: "Incorrect password" })
    }
    if (password != confirmPassword) {
      return res.status(httpStatus.FORBIDDEN).send({ message: 'password and confirm password did not match' });
    }
    const hash = await bcrypt.hash(password, 10);
    const users = await User.findOneAndUpdate({ email: user.email }, { password: hash, lastUpdatedPassword: new Date().toISOString() });

    if (users) {
      return res.status(httpStatus.OK).send({ message: 'password updated successfull' })
    }
    else {
      res.status(httpStatus.NOT_FOUND).send({ message: 'No user found with this email' })
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile image
 * @public
 */
exports.uploadFile = async (req, res, next) => {
  try {

    const savedUser = await User.findByIdAndUpdate(req.user._id, { picture: req.file.filename });
    res.status(httpStatus.OK).send({ imageUrl: req.file.filename });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload documents
 * @public
 */
exports.uploadDoc = async (req, res, next) => {
  try {

    let user = await User.findOne({ _id: req.user._id })

    req.file.filename = req.file.filename.split(" ").join("_");
    user.documents.push(req.file.filename)

    const savedUser = await User.findByIdAndUpdate(req.user._id, user);
    res.status(httpStatus.OK).send({ imageUrl: req.file.filename });
  } catch (error) {
    next(error);
  }
};

/**
 * Enable/disable Google auth
 * @public
 */
exports.googleAuth = async (req, res, next) => {
  try {
    if (googleAuth) {
      if (parseInt(req.query.status)) {
        let secret = GA.secret();
        const savedUser = await User.findByIdAndUpdate(req.user._id,
          {
            googleAuth: true,
            googleAuthKey: secret
          }
        );
        var qrCode = GA.qrCode(req.user.email, 'Crypto Gold', secret);
        res.status(httpStatus.OK).send({ key: secret, qrCode });
      }

      // Disabling Google auth & making google auth key null
      else if (parseInt(req.query.status) === 0) {
        const savedUser = await User.findByIdAndUpdate(req.user._id, { googleAuth: false, googleAuthKey: null });
        res.status(httpStatus.OK).send({ message: "Google auth has been disabled" });
      }
      else {
        res.status(httpStatus.NOT_MODIFIED).send({ message: "Incorrect query parameters" })
      }
    }
    else {
      res.status(httpStatus.FORBIDDEN).send({ message: "Google auth is disabled from api" });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Save bank accounts
 * @public
 */
exports.saveBankAccount = async (req, res, next) => {
  try {

    let user = req.user;
    let updatedUser = await User.updateOne({ _id: user.id }, {
      $push: {
        bankAccounts: { beneficiary: req.body.beneficiary, bankName: req.body.bankName, accountNumber: req.body.accountNumber, city: req.body.city, country: req.body.country, swiftCode: req.body.swiftCode }
      }
    })
    // let updatedUser = await User.findOneAndUpdate({ _id: user._id, "bankAccounts.accountNumber": { $ne: req.body.accountNumber } }, { $addToSet: { "bankAccounts": req.body } }, { new: true });
    if (updatedUser) {
      console.log("Updated user : ", updatedUser);
      res.status(httpStatus.OK).send({ message: "Bank account added" });
    }
  } catch (error) {
    next(error)
  }
}

/** 
* Update the account information in user profile
*/
exports.userBankAccount = async (req, res, next) => {
  try {
    let user = req.user;

    let userAccount = await User.findByIdAndUpdate(
      user._id,
      {
        $set:
        {
          bankAccount: {
            name: req.body.accountName,
            number: req.body.accountNumber,
            swift: req.body.swift,
            btc: req.body.btc
          }
        }
      }
    )
    if (userAccount) {
      return res.status(httpStatus.OK).send({ message: "Account info updated successfully" });
    }
  }
  catch (error) {
    next(error);
  }
}

exports.getBalance = async (req, res, next) => {
  try {
    let user = req.user;
    if (user.account.address) {
      console.log("User account address : ", user.account.address);
      // let response = await axios.get(blockchain.baseUrl + blockchain.getBalance + user.account.address);
      let response = await index.checkBal(user.account.address);
      res.status(httpStatus.OK).send({ balance: response });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "user donot have wallet address" });
    }
  } catch (error) {
    next(error)
  }
}

exports.getAccount = async (req, res, next) => {
  try {
    var user = req.user;

    const address = user.account.address;

    if (user.ethPublicKey) {

      let bal = await chargesService.getUserBalance(user.id);

      res.status(httpStatus.OK).send({ bal, address });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "User don't have wallet address" });
    }
  } catch (error) {
    console.log(error, "Error during get account from block chain");

    next(error)
  }
}

exports.getAccount1 = async (req, res, next) => {
  try {
    console.log(req.params.id);
    var user = await User.findOne({_id: req.params.id});
    
    const address = user.account.address;
    
    if (user.ethPublicKey) {

      // let response = await index.checkBal(user.ethPublicKey);
      let bal = await chargesService.getUserBalance(user.id);

      // response.data.actualbalance = bal.calculatedCoins;
      // response.data.totalHolded = bal.holdedCoins;
      // response.data.totalCoins = bal.totalCoins;

      res.status(httpStatus.OK).send({ bal, address });
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "User don't have wallet address" });
    }
  } catch (error) {
    console.log(error, "Error during get account from block chain");

    next(error)
  }
}

