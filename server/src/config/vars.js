const path = require('path');

// import .env variables
require('dotenv-safe').load({
  path: path.join(__dirname, '../../.env'),
  sample: path.join(__dirname, '../../.env.example'),
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  mongo: {
    uri: process.env.NODE_ENV === 'test'
      ? process.env.MONGO_URI_TESTS
      : process.env.MONGO_URI,
  },
  logs: process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
  sendVerificationMail: false,
  sendVerificationSms: false,
  googleAuth: true,
  hasToRegisterToBlockchain: true,
  uploadFolderPath: './assets',
  uploadImagePath: './assets/images',
  url: process.env.URL,
  blockchain: {
    baseUrl: "http://127.0.0.1:8545",
    getBalance: "/contract/balance/:account", // Send wallet address
    getAccount: "/api/accounts?address=", // Send wallet address
    getDelegate: "/api/delegates?limit=", //Send the total count of delegates
    getDelegateCount: "/api/delegates/count",
    getVotes: "/api/accounts/delegates?address=",//Send wallet address
    transaction: "/api/transactions",
    transfer: "/api/transactions",
    register: "/api/accounts/open",
    getAdminTransactions: "/api/v2/transfers?orderBy=t_timestamp:desc&ownerId=", // Send admin wallet address key
    // getUserTransactions: "/transactions?orderBy=t_timestamp:desc&ownerAddress=", // Send user wallet address
    getUserTransactions: "/api/v2/transfers?orderBy=t_timestamp:desc&ownerId=", // Send user wallet address
  },
  frontEnd: 'http://111.125.139.150:4203/forgetPassword/', // Admin app front end forget password  
  //frontEnd: 'http://103.14.127.78:4203/forgetPassword/', // Admin app front end forget password
  cryptrSecretKey: 'secretCode123'
};