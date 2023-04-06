const express = require('express');
const controller = require('../../controllers/transaction.controller');
const { authorize, LOGGED_USER, ADMIN } = require('../../middlewares/auth');
const router = express.Router();
const fileUploadConfig = require('../../../config/multermulti');
const docUploadConfig = require('../../../config/multermulti')


router
    .route('/')
    /**
     * @api {post} v1/transactions send money by wire transfer
     * @apiDescription user has to transfer money externally and enter his account details and amount
     * @apiVersion 1.0.0
     * @apiName sendMoneyByWire
     * @apiGroup transfer
     * @apiPermission user
     *
     * @apiParam  {String}  accountNumber     User's account number
     * @apiParam  {String}  amount            Amount of money he is sending
     *
     * @apiSuccess (Created 201) {String}     request successfully submited
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    // .get(authorize(), controller.getTransactions)
    /**
     * @api {post} v1/transactions create transaction
     * @apiDescription user has to transfer money externally and enter his account details and amount
     * @apiVersion 1.0.0
     * @apiName sendMoneyByWire
     * @apiGroup transfer
     * @apiPermission user
     *
     * @apiParam  {String}  currency          currency
     * @apiParam  {String}  type              trade
     * @apiParam  {String}  tradeType         bank/wallet
     * @apiParam  {Number}  coins             no. of coins
     * @apiParam  {String}  amount            Amount of money
     * @apiParam  {String}  sender            userId who will be sending
     * @apiParam  {String}  receiver          userId who will be receiving
     * @apiParam  {String}  remarks           remarks for the transaction
     * @apiParam  {String}  requested         true/false (true - when requesting to buy, false - when requesting to sell)
     *
     * @apiSuccess (Created 201) {String}     request successfully submited
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .post(authorize(LOGGED_USER), controller.saveTransaction);

 router.route('/confirmCoin').post(controller.confirmCoin);
    
router
    .route('/orders')
    /**
     * @api {get} v1/transactions/orders?type= get orders
     * @apiDescription get list of orders for users to trade
     * @apiVersion 1.0.0
     * @apiName get orders
     * @apiGroup Transactions
     * @apiPermission user
     *
     * @apiHeader {String}             Authorization  User's access token
     * @apiParam  {String}             type           buy/sell (buy - from which user can buy, sell - to whom user can sell)
     *
 of transaction     * @apiParam  {Number{1-}}         [page=1]     List page
     * @apiParam  {Number{1-100}}      [perPage=1]  transactions per page
     *
     * @apiSuccess {Object[]} transactions List of transactions.
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .get(authorize(), controller.getTrades)
    /**
     * @api {post} v1/transactions/orders create an order
     * @apiDescription to create an order
     * @apiVersion 1.0.0
     * @apiName create order
     * @apiGroup Transactions
     * @apiPermission user
     * 
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiParam  {String}  country           country
     * @apiParam  {String}  currency          currency
     * @apiParam  {String}  type              trade
     * @apiParam  {String}  tradeType         bank/wallet (payment mode)
     * @apiParam  {String}  accountNumber     account no./wallet address (in case of buy order)
     * @apiParam  {Number}  coins             no. of coins
     * @apiParam  {String}  amount            rate
     * @apiParam  {String}  requested         true/false (true - when requesting to buy, false - when requesting to sell)
     * @apiParam  {String}  sender            userId who will be sending
     * @apiParam  {String}  receiver          userId who will be receiving
     * @apiParam  {String}  remarks           remarks for the transaction
     *
     * @apiSuccess (Created 201) {String}     request successfully submited
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .post(authorize(), controller.saveTransaction)

router
    .route('/orders/:id')
    /**
     * @api {put} v1/transactions/orders/:id update order
     * @apiDescription to send trade request
     * @apiVersion 1.0.0
     * @apiName update order
     * @apiGroup Transactions
     * @apiPermission user
     * 
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiParam  {String}  accountNumber     account no./wallet address (in case of sell)
     * @apiParam  {String}  sender            userId who will be sending (in case of buy)
     * @apiParam  {String}  receiver          userId who will be receiving (in case of sell)
     * @apiParam  {String}  remarks           remarks for the transaction
     * @apiParam  {String}  status            status for the transaction (to update status)
     *
     * @apiSuccess (Created 201) {String}     request successfully submited
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .put(authorize(), controller.updateTransaction);


    router
    .route('/profileImageUploadMultiple')
    /**
     * @api {put} v1/users/profileImageUpload Update profile image
     * @apiDescription Uploads the profile image of the user
     * @apiVersion 1.0.0
     * @apiName Profile image upload
     * @apiGroup User
     * @apiPermission user
     * 
     * 
     * //Uploading multiple files
  app.post('/uploadmultiple', upload.array('myFiles', 12), (req, res, next) => {
      const files = req.files
      if (!files) {
        const error = new Error('Please choose files')
        error.httpStatusCode = 400
        return next(error)
      }
     
        res.send(files)
      
    })
     *
     * @apiHeader {String} Athorization  User's access token
     *
     * @apiParam  {file}               profileImage     Profile image (only accepts following formats jpeg, jpg, png )
     *
     * @apiSuccess {String}            imageUrl         Image url
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
     * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
     * @apiError (Not Found 404)    NotFound     User does not exist
     */
    .post(docUploadConfig.docUploadConfig.array("files"), controller.uploadFile);


router
    .route('/purchaseCoins')
    /**
     * @api {get} v1/transactions/purchaseCoins get purchase coins transactions
     * @apiDescription user has to transfer money externally and enter his account details and amount
     * @apiVersion 1.0.0
     * @apiName get purchase coins transactions
     * @apiGroup Transactions
     * @apiPermission user
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiParam  {Number{1-}}         [page=1]             List page
     * @apiParam  {Number{1-100}}      [perPage=1]          Transactions per page
     * @apiParam  {String}      status               status of transactions
     * @apiParam  {String}      startDate                start date in iso format
     * @apiParam  {String}      endDate                  end date in iso format
     *
     * @apiSuccess {Object[]}          transactions         List of transactions.
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get(authorize(), controller.getPurchaseCoins)
    /**
     * @api {post} v1/transactions/purchaseCoins purchase coins
     * @apiDescription purchase coins from admin either by btc or wire
     * @apiVersion 1.0.0
     * @apiName purchase coins
     * @apiGroup Transactions
     * @apiPermission user
     * 
     * @apiHeader {String} Athorization  User's access token
     *
     * @apiParam {String}   uniqueId          User's unique id
     * @apiParam  {String}  currency          Currency
     * @apiParam  {String}  amount            Amount of money he is sending
     * @apiParam  {String}  type              payment mode, either btc/wire
     *
     * @apiSuccess (Created 201) {String}     request successfully submited
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .post(authorize(), controller.purchaseCoins);

//Admin purchase request new --------------------------------------
    router
    .route('/purchaseCoinsAdmin')
    /**
     * @api {get} v1/transactions/purchaseCoins get purchase coins transactions
     * @apiDescription user has to transfer money externally and enter his account details and amount
     * @apiVersion 1.0.0
     * @apiName get purchase coins transactions
     * @apiGroup Transactions
     * @apiPermission user
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiParam  {Number{1-}}         [page=1]             List page
     * @apiParam  {Number{1-100}}      [perPage=1]          Transactions per page
     * @apiParam  {String}      status               status of transactions
     * @apiParam  {String}      startDate                start date in iso format
     * @apiParam  {String}      endDate                  end date in iso format
     *
     * @apiSuccess {Object[]}          transactions         List of transactions.
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get(authorize(), controller.getPurchaseCoinsAdmin)
    /**
     * @api {post} v1/transactions/purchaseCoins purchase coins
     * @apiDescription purchase coins from admin either by btc or wire
     * @apiVersion 1.0.0
     * @apiName purchase coins
     * @apiGroup Transactions
     * @apiPermission user
     * 
     * @apiHeader {String} Athorization  User's access token
     *
     * @apiParam {String}   uniqueId          User's unique id
     * @apiParam  {String}  currency          Currency
     * @apiParam  {String}  amount            Amount of money he is sending
     * @apiParam  {String}  type              payment mode, either btc/wire
     *
     * @apiSuccess (Created 201) {String}     request successfully submited
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .post(authorize(), controller.purchaseCoinsAdmin);


router
    .route('/sendCoins')
    /**
     * @api {post} v1/transactions/sendCoins transfer coin
     * @apiDescription transfer coins
     * @apiVersion 1.0.0
     * @apiName transfer coins
     * @apiGroup Transactions
     * @apiPermission user
     * 
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiParam  {String}  walletAddress     wallet address
     * @apiParam  {Number}  coins             no. of coins
     * @apiParam  {String}  amount            rate
     * @apiParam  {String}  remarks           remarks for the transaction
     *
     * @apiSuccess (Created 201) {String}     request successfully submited
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .post(authorize(), controller.sendCoins);

router
    .route('/directTransfer')
    /**
     * @api {post} v1/transactions/directTransfer transfer coin
     * @apiDescription transfer coins
     * @apiVersion 1.0.0
     * @apiName transfer coins
     * @apiGroup Transactions
     * @apiPermission user
     * 
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiParam  {String}  walletAddress     wallet address
     * @apiParam  {Number}  coins             no. of coins
     * @apiParam  {String}  amount            rate
     * @apiParam  {String}  remarks           remarks for the transaction
     *
     * @apiSuccess (Created 201) {String}     request successfully submited
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .post(authorize(), controller.directTransfer);

router
    .route('/userTrades')
    /**
     * @api {get} v1/transactions/userTrades get user's trade history
     * @apiDescription get list of particular user trades
     * @apiVersion 1.0.0
     * @apiName get user trades
     * @apiGroup Transactions
     * @apiPermission user
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiParam  {String}             status       Status of transaction (query)
     * @apiParam  {String}             paymentMode  bank/wallet (query)
     * @apiParam  {String}             type         buy/sell (query)
     * @apiParam  {Number{1-}}         [page=1]     List page
     * @apiParam  {Number{1-100}}      [perPage=1]  transactions per page
     *
     * @apiSuccess {Object[]} transactions List of transactions.
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .get(authorize(), controller.getUserTrades)


router
    .route('/trades')
    /**
     * @api {get} v1/transactions/trades get trades 
     * @apiDescription get list of trades (admin)
     * @apiVersion 1.0.0
     * @apiName get trades (admin)
     * @apiGroup Transactions
     * @apiPermission admin
     *
     * @apiHeader {String}             Authorization  User's access token
     *
     * @apiParam  {Number{1-}}         country      country
     * @apiParam  {Number{1-}}         currency     currency
     * @apiParam  {Number{1-}}         status       status
     * @apiParam  {Number{1-}}         amount       amount
     * @apiParam  {Number{1-}}         startDate    startDate
     * @apiParam  {Number{1-}}         endDate      endDate
     * @apiParam  {Number{1-}}         page         page
     * @apiParam  {Number{1-}}         perPage      perPage
     * @apiParam  {Number{1-}}         router       router
     * @apiParam  {Number{1-}}         [page=1]     List page
     * @apiParam  {Number{1-100}}      [perPage=1]  transactions per page
     *
     * @apiSuccess {Object[]} transactions List of transactions.
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .get(authorize(), controller.getTradesHistory)

router
    .route('/adminTransactions')
    /**
     * @api {get} v1/transactions/adminTransactions get admin transactions from blockchain
     * @apiDescription get list of admin transactions (admin)
     * @apiVersion 1.0.0
     * @apiName get admin transactions (admin)
     * @apiGroup Transactions
     * @apiPermission admin
     *
     * @apiHeader {String}             Authorization  User's access token
     *
     *
     * @apiSuccess {Object[]} transactions List of transactions.
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .get(authorize(), controller.getAdminTransactions)
    
router
    .route('/userTransactions')
    /**
     * @api {get} v1/transactions/userTransactions get user transactions from blockchain
     * @apiDescription get list of user transactions (user)
     * @apiVersion 1.0.0
     * @apiName get user transactions (user)
     * @apiGroup Transactions
     * @apiPermission user
     *
     * @apiHeader {String}             Authorization  User's access token
     *
     *
     * @apiSuccess {Object[]} transactions List of transactions.
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .get(authorize(), controller.getUserTransactions)

    router
    .route('/userTransactions2/:id')
    /**
     * @api {get} v1/transactions/userTransactions get user transactions from blockchain
     * @apiDescription get list of user transactions (user)
     * @apiVersion 1.0.0
     * @apiName get user transactions (user)
     * @apiGroup Transactions
     * @apiPermission user
     *
     * @apiHeader {String}             Authorization  User's access token
     *
     *
     * @apiSuccess {Object[]} transactions List of transactions.
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     */
    .get(authorize(), controller.getUserTransactions2)
 
    
router
    .route('/purchaseCoins/:id')
    /**
   * @api {put} v1/transactions/purchaseCoins/:id Update purchase coins Transaction
   * @apiDescription Updates purchase coins transaction
   * @apiVersion 1.0.0
   * @apiName Update purchase coins Transaction
   * @apiGroup Transactions
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {String}             status           pending/confirm/cancel/pause/restart
   * @apiParam  {String}             sender           id of sender
   * @apiParam  {String}             receiver         id of receiver
   * @apiParam  {String}             amount           amount of transaction
   * @apiParam  {String}             accountNumber    account number
   *
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .put(authorize(ADMIN), controller.updateTransaction)

router
    .route('/updateTransactionStatus/:id')
    /**
     * @api {put} v1/transactions/updateTransactionStatus/:id Update purchase coins Transaction
     * @apiDescription Updates purchase coins transaction
     * @apiVersion 1.0.0
     * @apiName Update purchase coins Transaction
     * @apiGroup Transactions
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiParam  {String}             status           pending/confirm/cancel/pause/restart
     * @apiParam  {String}             sender           id of sender
     * @apiParam  {String}             receiver         id of receiver
     * @apiParam  {String}             amount           amount of transaction
     * @apiParam  {String}             accountNumber    account number
     *
     *
     * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
     * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
     * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
     * @apiError (Not Found 404)    NotFound     User does not exist
     */
    .put(authorize(), controller.updateTransactionStatus)

router
  .route('/updateStatus/:id')
  /**
   * @api {put} v1/transactions/updateStatus/:id Update Transaction
   * @apiDescription Updates transaction status
   * @apiVersion 1.0.0
   * @apiName Update Transaction status
   * @apiGroup Transactions
   * @apiPermission user
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {String}             status           pending/confirm/cancel/pause/restart
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .put(authorize(), controller.updateStatus)

  router

  //updating status for admin coin pay by user --------------------------------------
  .route('/updateStatusUser/:id')
  /**
   * @api {put} v1/transactions/updateStatus/:id Update Transaction
   * @apiDescription Updates transaction status
   * @apiVersion 1.0.0
   * @apiName Update Transaction status
   * @apiGroup Transactions
   * @apiPermission user
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {String}             status           pending/confirm/cancel/pause/restart
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .put(authorize(), controller.updateStatusUser)

router
  .route('/confirmTransaction/:id')
  /**
   * @api {put} v1/transactions/confirmTransaction/:id Admin confirm the disputed transaction
   * @apiDescription Updates transaction status
   * @apiVersion 1.0.0
   * @apiName Update Transaction status
   * @apiGroup Transactions
   * @apiPermission user
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {String}             status           pending/confirm/cancel/pause/restart
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .put(authorize(), controller.confirmTransaction)

router
  .route('/getAccountCoinDetail/:address')
  /**
   * @api {get} v1/transactions/getAccountCoinDetail/:address Admin confirm the disputes transaction
   * @apiDescription Updates transaction status
   * @apiVersion 1.0.0
   * @apiName Update Transaction status
   * @apiGroup Transactions
   * @apiPermission user
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {String}             status           pending/confirm/cancel/pause/restart
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only user with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     User does not exist
   */
  .get(authorize(), controller.getAccountCoinDetail)

module.exports = router;