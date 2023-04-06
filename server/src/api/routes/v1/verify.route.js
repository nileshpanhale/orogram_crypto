const express = require('express');
const controller = require('../../controllers/verification.controller');
const router = express.Router();

/**
 * @api {get} v1/verify/email/:uuid Verify email
 * @apiDescription Verify user's email id
 * @apiVersion 1.0.0
 * @apiName VerifyEmail
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}          uuid     User's unique id
 *
 * @apiSuccess (Created 201) {message}    message
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 */
router.route('/email/:userId')
  .get(controller.verifyUserEmail);


/**
 * @api {post} v1/verify/otp Verify OTP
 * @apiDescription Verify 6 digit OTP
 * @apiVersion 1.0.0
 * @apiName VerifyOtp
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}          email     User's email
 * @apiParam  {String}          otp       User's otp
 *
 * @apiSuccess (Created 201) {String}  message:message  OTP verified
 *
 * @apiError (Bad Request 404)  NOT_FOUND  OTP did not match
 */

router.route('/otp')
  .post(controller.verifyMobileOtp);

module.exports = router;