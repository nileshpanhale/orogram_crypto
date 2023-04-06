const httpStatus = require('http-status');
const axios = require('axios');
const { omit } = require('lodash');
const User = require('../models/user.model');
const AdminAccount = require('../models/adminAccount.model');
const Transactions = require('../models/transactions.model');
const blkTRX = require("../models/tx.model");
const { handler: errorHandler } = require('../middlewares/error');
const { sendPasswordEmail, sendAdminPasswordEmail } = require('./verification.controller');
const { blockchain, frontEnd, cryptrSecretKey } = require('../../config/vars');
const bcrypt = require('bcryptjs');
const Cryptr = require('cryptr');
const delay = require('delay');
const chargesService = require('../services/chargesTranceferService');
const index = require('../../../../cryptogold-blockchain/src/index');


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
 * Update existing user
 * @public
 */
exports.update = async (req, res) => {
  const ommitRole = req.locals.user.role == 'admin' ? 'role' : '';
  const updatedUser = omit(req.body, ommitRole);
  if (isActive) {
    const user = Object.assign(req.locals.user, { "$set": { "active": false } }, updatedUser);
    user.save()
      .then(savedUser => res.json(savedUser.transform()))
      .catch(e => next(User.checkDuplicateEmail(e)));
  }
};

/**
 * Get user list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const users = await User.list(req.query);
    const transformedUsers = users.map(user => user.transform());
    res.json(transformedUsers);
  } catch (error) {
    next(error);
  }
};

/**
* get stats of users
* @public
*/
exports.getUserStats = async (req, res, next) => {
  try {
    
    if (req.user.role != 'admin' && req.user.role != 'subAdmin') {
      return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
    }
    let usersCount = await User.find({}).count();
    let activerUsersCount = await User.find({ isActive: true }).count();
    let deactiverUsersCount = await User.find({ isActive: false }).count();

    res.status(httpStatus.OK).send({ users: usersCount, activerUsers: activerUsersCount, deactiverUsers: deactiverUsersCount });

  } catch (error) {
    next(error)
  }
}

/**
* get stats of trades
* @public
*/
exports.getTradeStats = async (req, res, next) => {
  try {
    if (req.user.role != 'admin' && req.user.role != 'subAdmin') {
      return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
    }
    let tradesCount = await Transactions.find({ type: 'trade' }).count();
    console.log(tradesCount, "Trade count");
    let buyCount = await Transactions.find({ type: 'trade', requested: true }).count();
    console.log(buyCount, "Buy count.");
    let sellCount = await Transactions.find({ type: 'trade', requested: false }).count();
    console.log(sellCount, "sell count.");

    res.status(httpStatus.OK).send({ trades: tradesCount, buys: buyCount, sells: sellCount });

  } catch (error) {
    next(error)
  }
}

/**
 * get company account stat
 * @public
 */
exports.getCompanyStat = async (req, res, next) => {
  try {

    let admin = req.user;
    if (req.user.role != 'admin' && req.user.role != 'subAdmin') {
      return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
    }
    let adminUser = await User.findOne({ role: 'admin' });

    console.log("Admin public key : ", adminUser.account.publicKey);
    let response = await index.checkBal(adminUser.account.publicKey);
    console.log("Admin balance : ", response);
    if (response) {
      res.status(httpStatus.OK).send({ balance: response });
    }
    else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "No response from blockchain" });
    }
  } catch (error) {
    next(error)
  }
}

/**
 * create user 
 */
exports.createUser = async (req, res, next) => {
  try {
    let body = req.body;
    // body['password'] = randomString();
    body['password'] = "123456789";

    const user = await (new User(body)).save();
    if (user) {

      let passwordToken = randomString(30);

      let newUser = await User.findOneAndUpdate({ _id: user._id }, { passwordToken: passwordToken }, { new: true });
      console.log(newUser, "after token update");
      passwordToken = frontEnd + passwordToken;
      await sendAdminPasswordEmail(passwordToken, { to: newUser.email });
      return res.status(httpStatus.OK).send({ message: "New user created" });
      // sendPasswordEmail(body['password'], { to: user.email });
    }
  } catch (error) {
    next(User.checkDuplicateEmail(error))
  }
}

exports.forgetPassword = async (req, res, next) => {
  try {
    let passwordToken = randomString(30);

    let admin = await User.findOneAndUpdate({ role: 'admin' }, { passwordToken: passwordToken }, { new: true });
    console.log(admin, "after token update");
    passwordToken = frontEnd + passwordToken;
    await sendAdminPasswordEmail(passwordToken, { to: admin.email });
    res.send({ message: "Link to reset password has been sent you in mail" });
  } catch (error) {
    next(error)
  }
}

exports.resetPassword = async (req, res, next) => {
  try {
    console.log(req.body, "req bodt");

    const { passwordToken, password, confirmPassword } = req.body;
    // let admin = await User.findOne(passwordToken);
    let admin = await User.findOne({ passwordToken: passwordToken });
    console.log(admin, "adiom found");

    if (!admin) {
      return res.status(httpStatus.NOT_IMPLEMENTED).send({ message: "Wrong token" })
    }
    if (password != confirmPassword) {
      return res.status(httpStatus.FORBIDDEN).send({ message: 'password and confirm password did not match' });
    }
    console.log(password, "GERNART HASH");

    const hash = await bcrypt.hash(password, 10);
    console.log(hash, "hash");

    const user = await User.findOneAndUpdate({ passwordToken: passwordToken }, { password: hash, lastUpdatedPassword: new Date().toISOString() });
    console.log(user, "fobd admins");

    if (user) {
      return res.status(httpStatus.OK).send({ message: 'password updated successfull' })
    }
    else {
      res.status(httpStatus.NOT_FOUND).send({ message: 'No user found with this email' })
    }
  } catch (error) {
    console.log(error, "error");
    next(error)

  }
}

exports.getAccount = async (req, res, next) => {
  try {
    if (req.user.role != ' ' && req.user.role != 'admin') {
      return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
    }
    let admin = await User.findOne({ role: 'admin' });
    if (admin.account.publicKey) {
      // let response = await axios.get(blockchain.baseUrl + blockchain.getAccount + admin.account.publicKey);
      let response = await index.checkBal(admin.account.publicKey);
      console.log("Fetched admin account : ", response);
      res.status(httpStatus.OK).send(response.data);
    } else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "user donot have wallet address" });
    }
  } catch (error) {
    console.log(error, "error during account get from block chain");

    next(error)
  }
}

exports.getVotedList = async (req, res, next) => {
  try {
    if (req.user.role != 'admin' && req.user.role != 'subadmin') {
      return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
    }
    let admin = await User.findOne({ role: 'admin' });
    if (admin.account.address) {
      let response = await axios.get(blockchain.baseUrl + blockchain.getVotes + admin.account.address);
      res.status(httpStatus.OK).send(response.data);
    }
    else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: "user donot have wallet address" });
    }
  } catch (error) {
    console.log(error, "error in getting voted list from blockchain");
    next(error);
  }
}

exports.getDelegateList = async (req, res, next) => {
  try {
    if (req.user.role != 'admin' && req.user.role != 'subadmin') {
      return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
    }
    let totalCount = await axios.get(blockchain.baseUrl + blockchain.getDelegateCount);
    let response = await axios.get(blockchain.baseUrl + blockchain.getDelegate + totalCount.data.count);
    res.status(httpStatus.OK).send(response.data);
  } catch (error) {
    console.log(error, "error in getting delegate list from blockchain");
    next(error);
  }
}

exports.voteDelegates = async (req, res, next) => {
  try {
    let admin = req.user;
    if (admin.role != 'admin') {
      return res.status(UNAUTHORIZED).send({ message: "Unauthorized access" });
    }
    admin = await User.findOne({ role: 'admin' });
    console.log("args", req.body.args);
    let payload = {
      "type": 11,
      "fee": 0,
      "args": req.body.args,
      "secret": admin.account.secret
    }
    console.log("payload", payload);
    let response = await axios.put(blockchain.baseUrl + blockchain.transaction, payload);
    console.log("response", response);
    if (response.data.success) {
      res.status(httpStatus.OK).send(response.data);
    }
    else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send(response.data);
    }
  }
  catch (error) {
    next(error);
  }
}

exports.unvoteDelegates = async (req, res, next) => {
  try {
    console.log("user", req.user);
    console.log("body", req.body);
    let admin = req.user;
    if (admin.role != 'admin') {
      return res.status(UNAUTHORIZED).send({ message: "Unauthorized access" });
    }
    admin = await User.findOne({ role: 'admin' });
    let payload = {
      "type": 12,
      "fee": 0,
      "args": req.body.args,
      "secret": admin.account.secret
    }
    let response = await axios.put(blockchain.baseUrl + blockchain.transaction, payload);
    if (response.data.success) {
      res.status(httpStatus.OK).send(response.data);
    }
    else {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).send(response.data);
    }
  }
  catch (error) {
    next(error);
  }
}

exports.delegateRegister = async (req, res, next) => {
  try {
    let admin = req.user;
    const cryptr = new Cryptr(cryptrSecretKey);
    if (admin.role != 'admin') {
      return res.status(UNAUTHORIZED).send({ message: "Unauthorized access" });
    }
    let delegateUser = await User.findOne({ userId: req.body.userId });
    console.log("delegate", delegateUser);
    if (delegateUser) {
      console.log("delegateUser", delegateUser.account.privateKey);
      const secret = await cryptr.decrypt(delegateUser.account.privateKey);
      const secretKey = await getSecret(secret);
      console.log("secret", secretKey);
      console.log("name", delegateUser.userId.toLowerCase());
      let payloadName = {
        "type": 2,
        "fee": 0,
        "args": [delegateUser.userId.toLowerCase()],
        "secret": secretKey
      }
      console.log("payload", payloadName);
      let responseName = await axios.put(blockchain.baseUrl + blockchain.transaction, payloadName);
      await delay(15000);
      if (responseName.data.success) {
        let payload = {
          "type": 10,
          "fee": 0,
          "secret": secretKey
        }
        console.log("payload delegate", payload);
        console.log("URL", blockchain.baseUrl + blockchain.transaction, payload);
        let response = await axios.put(blockchain.baseUrl + blockchain.transaction, payload);
        console.log("response", response.data);
        if (response.data.success) {
          res.status(httpStatus.OK).send(response.data);
        }
        else {
          res.status(httpStatus.INTERNAL_SERVER_ERROR).send(response.data);
        }
      }
      else {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).send(responseName.data);
      }
    }
  }
  catch (error) {
    next(error);
  }
}

exports.updateAccountInfo = async (req, res, next) => {

  try {
    
    const account = await AdminAccount.findOneAndUpdate({ role: "admin" }, {
      btcWalletAddress: req.body.btcWalletAddress,
      accountName: req.body.accountName,
      accountNumber: req.body.accountNumber,
      accountIfsc: req.body.accountIfsc,
      accountSwift: req.body.accountSwift,
      accountAddress: req.body.accountAddress
    });
    
    if (account) {
      return res.status(httpStatus.OK).send({ message: "Information updated successfully" });
    }
    else {
      return res.status(httpStatus.NOT_FOUND).send({ message: "User doesnot exist" });
    }
  }
  catch (error) {
    next(error);
  }
}


exports.getAccountInfo = async (req, res, next) => {
  try {
    const data = await User.findOne({ role: "admin" });
    const account = await AdminAccount.findOne({ email: data.email });
    console.log("Admin account details : ", account);

    if (account) {
      return res.status(httpStatus.OK).send(account);
    }
    else {
      return res.status(httpStatus.NOT_FOUND).send({ message: "User doesnot exist" });
    }
  }
  catch (error) {
    next(error);
  }
}


function randomString(length = 6) {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  for (var i = 0; i < length; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

function getSecret(secret) {
  var secretSplit = secret.split(" ");
  var newSecret = " ";
  for (let i = 0; i < 12; i++) {
    newSecret = newSecret + secretSplit[i] + " ";
  }
  return (newSecret.trim());
}

exports.getAdminTotalHolded = async (req, res, next) => {
  try {

    let bal = await chargesService.getTotalAdminHoldBalance();
    console.log("admin holded balance in chargesService : ", bal);

    return res.status(httpStatus.OK).send(bal);

  }
  catch (error) {
    next(error);
  }
}

// Get blockchain transactions of all USERS
exports.walletTransactions = async (req, res, next) => {
  try {
    if (req.user.role != 'admin' && req.user.role != 'subAdmin') {
      return res.status(httpStatus.FORBIDDEN).send({ message: "You are not authorized" });
    }
    let transactions
    let txIds = []
    let data = []
    let count = 0
    let users = await User.find({ role: "user" }).sort({ updatedAt: -1 })
    console.log("User count : ", users.length);

    let block = await blkTRX.find().sort({updatedAt : -1});
    
    users.forEach(async (user) => {

      if (user.account.address) { 
        queryObj = { query: { $or: [{ senderWallet: user.account.address }, { receiverWallet: user.account.address }] } };
        transactions = await Transactions.list(queryObj);
        count = transactions.length;
      }
    return res.status(httpStatus.OK).send({ count: count, transfers: block })
    })
    // return res.status(httpStatus.OK).send({ count: count, transfers: block })
  } catch (err) {
    next(err);
  }
}

