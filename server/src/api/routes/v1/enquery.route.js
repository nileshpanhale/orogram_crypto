const express = require('express');
const controller = require('../../controllers/enquiry.controller');
const router = express.Router();

/**
 * @api {post} v1/enquery/sendEnquiry send Enquery
 * @apiDescription Send enquery from customer
 * @apiVersion 1.0.0
 * @apiName sendEnquery
 * @apiGroup email
 * @apiPermission public
 *
 * @apiParam  {String}  email     User's email
 * @apiParam  {String}  name      User's full name
 * @apiParam  {String}  query     User's query
 *
 * @apiSuccess (Created 201) {String}  query successfully submited
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 */
router.route('/sendEnquiry')
  .post(controller.sendEnquery);

// router.route('/fetchRates')
//   .get(controller.fetchRates);

router.route('/goldprice')
  .get(controller.goldBtcAPI);

router.route('/currencyRate')
  .get(controller.currencyRate);

module.exports = router;