const express = require('express');
const controller = require('../../controllers/transfer.controller');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');
const router = express.Router();


router.route('/wire')
  /**
   * @api {post} v1/transferMoney/wire send money by wire transfer
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
  .post(authorize(LOGGED_USER), controller.saveWireTransfer);

module.exports = router;
