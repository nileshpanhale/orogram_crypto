const express = require('express');
const controller = require('../../controllers/otp.controller');
const router = express.Router();

/**
 * @api {post} v1/generate/otp Generate OTP
 * @apiDescription Generate 6 digit OTP
 * @apiVersion 1.0.0
 * @apiName GenerateOtp
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}          email     User's email
 *
 * @apiSuccess (Created 201) {String}  otp:otp     6 digit OTP
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 */
router.route('/otp')
  .post(controller.generateOtp);

module.exports = router;