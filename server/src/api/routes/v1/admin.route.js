const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/admin.controller');
const { authorize, ADMIN, LOGGED_USER } = require('../../middlewares/auth');
const {
  listUsers,
  updateUser,
} = require('../../validations/user.validation');

const { createUser } = require('../../validations/admin.validations');

const router = express.Router();

router
    .route('/userStats')
    /**
     * @api {get} v1/admin/userStats get userStats
     * @apiDescription statistics of users
     * @apiVersion 1.0.0
     * @apiName get userStats
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiSuccess {Object[]}          users                  users
     * @apiSuccess {Object[]}          activerUsers           active users
     * @apiSuccess {Object[]}          deactiverUsers         deactive users
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get(authorize(), controller.getUserStats);

router
    .route('/tradeStats')
    /**
     * @api {get} v1/admin/tradeStats get trade stats
     * @apiDescription statistics of trades
     * @apiVersion 1.0.0
     * @apiName get trade stats
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiSuccess {Object[]}          trades          total trades
     * @apiSuccess {Object[]}          buys            total buy trades
     * @apiSuccess {Object[]}          sells           total sell trades
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get(authorize(), controller.getTradeStats);


router
    .route('/companyStat')
    /**
     * @api {get} v1/admin/companyStat get company stats
     * @apiDescription statistics of company
     * @apiVersion 1.0.0
     * @apiName get company stats
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiSuccess {Object[]}          success              true/false
     * @apiSuccess {Object[]}          balance              balance in the walled
     * @apiSuccess {Object[]}          unconfirmedBalance   un-confirmed balance
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get(authorize(), controller.getCompanyStat);

router
    .route('/createUser')
    /**
     * @api {get} v1/admin/createUser create user
     * @apiDescription create user 
     * @apiVersion 1.0.0
     * @apiName get company stats
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     * 
     *  
     * @apiParam  {String}         email     User's email
     * @apiParam  {String}         role      User's role
     * @apiParam  {String}         platform  [admin]
     *
     * @apiSuccess {Object}          message                 user created
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .post(authorize(ADMIN), validate(createUser), controller.createUser);

router
    .route('/forgetPassword')
    /**
     * @api {get} v1/admin/forgetPassword Forget password
     * @apiDescription statistics of company
     * @apiVersion 1.0.0
     * @apiName Forget password
     * @apiGroup Admin
     * @apiPermission admin
     *
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get( controller.forgetPassword)

    /**
     * @api {put} v1/admin/forgetPassword Reset password
     * @apiDescription statistics of company
     * @apiVersion 1.0.0
     * @apiName Reset password
     * @apiGroup Admin
     * @apiPermission admin
     *
     *
     * @apiParam  {String}         password             New password
     * @apiParam  {String}         confirmPassword      confirm password
     * @apiParam  {String}         forgetToken                password recovery token
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .put( controller.resetPassword);

router
    .route('/account')
    /**
     * @api {get} v1/admin/account User blockchain account
     * @apiDescription Get logged in user blockchain account information
     * @apiVersion 1.0.0
     * @apiName get blockchain account
     * @apiGroup User
     * @apiPermission user
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiSuccess {String}  success                  response from blockchain
     * @apiSuccess {String}  balance                  User's balance
     * @apiSuccess {String}  address                  User's wallet address
     * @apiSuccess {String}  unconfirmedBalance       User's unconfirmed balance
     *
     * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Users can access the data
     */
    .get(authorize(), controller.getAccount);


    router
    .route('/holdedTotal')
    /**
     * @api {get} v1/admin/account User blockchain account
     * @apiDescription Get logged in user blockchain account information
     * @apiVersion 1.0.0
     * @apiName get blockchain account
     * @apiGroup User
     * @apiPermission user
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiSuccess {String}  success                  response from blockchain
     * @apiSuccess {String}  balance                  User's balance
     * @apiSuccess {String}  address                  User's wallet address
     * @apiSuccess {String}  unconfirmedBalance       User's unconfirmed balance
     *
     * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Users can access the data
     */
    .get(authorize(), controller.getAdminTotalHolded);//getAdminTotalHolded



router
    .route('/delegates')
    /**
     * @api {get} v1/admin/delegates get delegate list
     * @apiDescription list of delegates
     * @apiVersion 1.0.0
     * @apiName get delegate list
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiSuccess {Object[]}       success                 response from blockchain
     * @apiSuccess {object[]}       delegate                delegate list
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get(authorize(), controller.getDelegateList);
    

router
    .route('/votedList')
    /**
     * @api {get} v1/admin/votes get vote list
     * @apiDescription number of votes done by admin
     * @apiVersion 1.0.0
     * @apiName get voting list
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     *
     * @apiSuccess {Object[]}       success                 response from blockchain
     * @apiSuccess {object[]}       votes                   voted list
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get(authorize(), controller.getVotedList);
    
router
    .route('/vote')
    /**
     * @api {get} v1/admin/vote voting of delegates by admin
     * @apiDescription Vote delegates 
     * @apiVersion 1.0.0
     * @apiName vote delagtes
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     * 
     *  
     * @apiParam  {String}         email     User's email
     * @apiParam  {String}         role      User's role
     * @apiParam  {String}         platform  [admin]
     *
     * @apiSuccess {Object}          message                 user created
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .post(authorize(ADMIN), controller.voteDelegates);

router
    .route('/unvote')
    /**
     * @api {get} v1/admin/vote voting of delegates by admin
     * @apiDescription Vote delegates 
     * @apiVersion 1.0.0
     * @apiName vote delagtes
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     * 
     *  
     * @apiParam  {String}         email     User's email
     * @apiParam  {String}         role      User's role
     * @apiParam  {String}         platform  [admin]
     *
     * @apiSuccess {Object}          message                 user created
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .post(authorize(ADMIN), controller.unvoteDelegates);

router
    .route('/delegateRegister')
    /**
     * @api {get} v1/admin/delegate register delegate
     * @apiDescription check delegates 
     * @apiVersion 1.0.0
     * @apiName check delegates
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     * 
     *  
     * @apiParam  {String}         email     User's email
     * @apiParam  {String}         role      User's role
     * @apiParam  {String}         platform  [admin]
     *
     * @apiSuccess {Object}          message                delegate
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .post(authorize(ADMIN), controller.delegateRegister);

router
    .route('/updateAccountInfo')
    /**
     * @api {get} v1/admin/updateAccountInfo update admin account information
     * @apiDescription update admin account information
     * @apiVersion 1.0.0
     * @apiName updateAccountInfo
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     * 
     *  
     * @apiParam  {String}         email     User's email
     * @apiParam  {String}         role      User's role
     * @apiParam  {String}         platform  [admin]
     *
     * @apiSuccess {Object}          message                delegate
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .post(authorize(ADMIN), controller.updateAccountInfo);

router
    .route('/getAccountInfo')
    /**
     * @api {get} v1/admin/getAccountInfo get admin account Info
     * @apiDescription get account info 
     * @apiVersion 1.0.0
     * @apiName getAccountInfo
     * @apiGroup Admin
     * @apiPermission admin
     *
     * @apiHeader {String} Authorization  User's access token
     * 
     *  
     * @apiParam  {String}         email     User's email
     * @apiParam  {String}         role      User's role
     * @apiParam  {String}         platform  [admin]
     *
     * @apiSuccess {Object}          message                delegate
     *
     * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
     */
    .get(authorize(), controller.getAccountInfo);


    router
        .route('/walletTransactions')
        /**
         * @api {get} v1/admin/wallet-transaction         
         * @apiDescription Get blockchain transactions of all USERS
         * @apiVersion 1.0.0
         * @apiName walletTransactions
         * @apiGroup Admin
         * @apiPermission admin
         *
         * @apiHeader {String} Authorization  User's access token
         * 
         *  
         * @apiParam  {String}         email     User's email
         * @apiParam  {String}         role      User's role
         * @apiParam  {String}         platform  [admin]
         *
         * @apiSuccess {Object}          message                delegate
         *
         * @apiError (Bad Request 400)  ValidationError         Some parameters may contain invalid values
         */
        .get(authorize(), controller.walletTransactions)

module.exports = router;
