const httpStatus = require('http-status');
const User = require('../models/user.model');
const RefreshToken = require('../models/refreshToken.model');
const moment = require('moment-timezone');
const OTP = require('otp.js');

const { jwtExpirationInterval, googleAuth, url, blockchain } = require('../../config/vars');
const { sendVerificationEmail } = require('./verification.controller');
const { sendVerificationMail, sendVerificationSms, hasToRegisterToBlockchain, cryptrSecretKey } = require('../../config/vars');

const Cryptr = require('cryptr');
const bcrypt = require('bcryptjs');

const axios = require('axios');

const hdKey = require('hdkey');
const bip39 = require('bip39');
const ethUtils = require('ethereumjs-utils');
const bitcore = require('bitcore-lib');

const crypr = new Cryptr(cryptrSecretKey);

// get GoogleAuthenticator object
const GA = OTP.googleAuthenticator;

/**
 * Returns a formated object with tokens
 */
function generateTokenResponse(user, accessToken) {
  const tokenType = 'Bearer';
  const refreshToken = RefreshToken.generate(user).token;
  const expiresIn = moment().add(jwtExpirationInterval, 'minutes');
  return {
    tokenType,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Registers the user into blockchain
 * @public
 */
const registerToBlockchain = async (req, res, next) => {
  try {

    const phrase = bip39.generateMnemonic();
    const phrase1 = bip39.generateMnemonic();
    const mnemonic = phrase + ' ' + phrase1;
    const seed = await bip39.mnemonicToSeed(phrase);
    const seed1 = await bip39.mnemonicToSeed(phrase1);
    const result = seed + ' ' + seed1;
    const root = hdKey.fromMasterSeed(result);

    //create wallet for ethereum platform
    const addrNode = root.derive("m/44'/60'/0'/0/0");               //derive path for ethereum platform
    const pvtKey = addrNode._privateKey;
    const pubKey = ethUtils.privateToPublic(addrNode._privateKey);
    const addr = ethUtils.publicToAddress(pubKey).toString('hex');
    const address = ethUtils.toChecksumAddress(addr);

    return { address, pvtKey, mnemonic };
  } catch (e) {
    console.log(e);
  }
};

/**
 * @dev create btc wallet
 */
async function btcWallet() {
  const buffer = bitcore.crypto.Random.getRandomBuffer(256);
  const hash = bitcore.crypto.Hash.sha256(buffer);
  const bn = bitcore.crypto.BN.fromBuffer(hash);
  const privateKey = new bitcore.PrivateKey(bn).toWIF();
  const publicKey = new bitcore.PrivateKey(bn).toAddress() + '';

  return { publicKey, privateKey };
};

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (req, res, next) => {
  try {

    let body = req.body;

    //creating eth address & storing on reg -----------------

    let myEthWallet = await registerToBlockchain();
    body.ethPublicKey = myEthWallet.address;
    body.ethPrivateKey = crypr.encrypt(myEthWallet.pvtKey.toString('hex'));
    body.secretKey = crypr.encrypt(myEthWallet.mnemonic);
    
    let myBtcWallet = await btcWallet();
    body.account = {};
    body.account.address = myBtcWallet.publicKey;
    body.account.publicKey = myBtcWallet.publicKey;
    body.account.privateKey = crypr.encrypt(myBtcWallet.privateKey);
    const user = await (new User(body)).save();
    const userTransformed = user.transform();
    const token = generateTokenResponse(user, user.token());
    res.status(httpStatus.CREATED);
    if (sendVerificationMail) {
      sendVerificationEmail(user.userId, { to: userTransformed.email });
    }

    return res.json({ token, user: userTransformed, phrase: myEthWallet.mnemonic });
  } catch (error) {
    console.log(error, "erorr during registerations")
    return next(User.checkDuplicateEmail(error));
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (req, res, next) => {
  try {

    let email = req.body.email
    let response = await User.findOne({ email });

    if (!response) {
      return res.json({ code: 401, message: "Incorrect Email or Password" });

    } else {

      if (response.isblock == true) {
        return res.json({ code: 401, message: "user blocked" });
      }

      else if (response.jwtToken && response.jwtToken != '') {
        return res.json({ code: 401, message: "User Already logged In." })
      }

      else {
        const { user, accessToken } = await User.findAndGenerateToken(req.body);

        if (!user.isActive) {
          return res.send({ isActive: user.isActive, message: "You are a deactivated user. Please contact admin." })
        }

        if (googleAuth && user.googleAuth) {

          const token = generateTokenResponse(user, accessToken);
          const userTransformed = user.transform();
          const responseupdate = await User.findOneAndUpdate({ email }, { count: 0, jwtToken: token.accessToken });

          return res.send({ googleAuth: true, message: "2-Step verification is enabled. Please enter code from google authenticator app" });
        }
        const token = generateTokenResponse(user, accessToken);

        const userTransformed = user.transform();
        const responseupdate = await User.findOneAndUpdate({ email }, { count: 0, jwtToken: token.accessToken });
        return res.json({ token, user: userTransformed });
      }

    }
  } catch (error) {

    const email = req.body.email
    let response = await User.FindOne({ email: email })
    if (response.count < 4) {
      let _id = response._id
      let count = response.count + 1;
      const responseupdate = await User.findOneAndUpdate({ email }, { count: count });
      return next(error);
    } else {
      const responseupdate = await User.findOneAndUpdate({ email }, { isblock: true });
      return next(error);
    }
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.loginWithUserId = async (req, res, next) => {
  try {
    const { user, accessToken } = await User.findUserIdAndGenerateToken(req.body);
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * login with an existing user or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (req, res, next) => {
  try {
    const { user } = req;
    const accessToken = user.token();
    const token = generateTokenResponse(user, accessToken);
    const userTransformed = user.transform();
    return res.json({ token, user: userTransformed });
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async (req, res, next) => {
  try {
    const { email, refreshToken } = req.body;
    const refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    });
    const { user, accessToken } = await User.findAndGenerateToken({ email, refreshObject });
    const response = generateTokenResponse(user, accessToken);
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.resendVerificationEmail = async (req, res, next) => {
  try {
    const { email, platform } = req.body;
    const user = await User.FindOne({ email, platform });
    sendVerificationEmail(user.userId, { to: email });
    return res.json({ message: 'Mail Sent' });
  } catch (error) {
    return next(error);
  }
};

/**
 * Check for 2-step verification and verifies user with google authenticator app
 * Returns user and jwt token
 * @public
 */
exports.twoFactorAuth = async (req, res, next) => {
  try {

    if (googleAuth) {
      const { email, code } = req.body;
      let user = await User.findOne({ email });
      if (user.googleAuth) {
        let result = GA.verify(code, user.googleAuthKey);

        // after successfull authentication
        if (result && result.hasOwnProperty('delta') && result.delta > -3) {

          const accessToken = user.token();
          const token = generateTokenResponse(user, accessToken);
          token.accessToken = user.jwtToken;
          const userTransformed = user.transform();
          return res.json({ token, user: userTransformed });
        } else {
          return res.status(httpStatus.UNAUTHORIZED).send({ message: "Incorrect code" });
        }
      } else {
        res.send({ message: "2-step verification is not enabled" });
      }
    } else {
      res.status(httpStatus.FORBIDDEN).send({ message: "2 step verification is disabled from server" });
    }
  } catch (error) {
    console.log(error, "error");

    return next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {

    let phrase = "";

    const { email, password, confirmPassword } = req.body;
    let user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(httpStatus.BAD_REQUEST).send({ message: "No such user exists" });
    }

    if (user.role == "admin") {
      // phrase = crypr.decrypt(user.account.secret);
      phrase = (user.account.secret);
      if (req.body.phrase != "hip zero uncover lemon regular island leaf auto job flag style use girl picnic satoshi smoke around odor wink lucky minor monitor actual lift") {
        return res.status(httpStatus.BAD_REQUEST).send({ message: 'Incorrect phrase' });
      }

    } else {
      phrase = crypr.decrypt(user.secretKey);
      if (phrase != req.body.phrase) {
        return res.status(httpStatus.BAD_REQUEST).send({ message: 'Incorrect phrase' });
      }
    }


    if (password != confirmPassword) {
      return res.status(httpStatus.FORBIDDEN).send({ message: 'password and confirm password did not match' });
    }

    const hash = await bcrypt.hash(password, 10);

    removejwtToken = ''
    const users = await User.findOneAndUpdate({ email }, { password: hash, jwtToken: removejwtToken });

    if (users) {
      const responseupdate = await User.findOneAndUpdate({ email }, { count: 0, isblock: false });
      return res.status(httpStatus.OK).send({ message: 'password updated successfull' })
    }
    else {
      res.status(httpStatus.BAD_REQUEST).send({ message: 'Not updates' });
    }



  } catch (error) {
    next(error);

  }
}

exports.logout = async (req, res, next) => {
  try {

    let user = await User.findOneAndUpdate({ jwtToken: req.body.token }, { jwtToken: '' })
    return res.status(httpStatus.OK).send({ message: 'Logout successfully' })

  } catch (error) {
    next(error);
  }
}