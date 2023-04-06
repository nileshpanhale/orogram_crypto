const mjml2html = require('mjml');
const credentials = require('../../config/credentials');
const registrationTemplate = require('../../templates/email/registration');
const passwordTemplate = require('../../templates/email/password');
const adminPasswordTemplate = require('../../templates/email/adminForgetPassword');
const userIdTemplate = require('../../templates/email/sendUserId');
const client = require('../../config/client');
const BulkMailer = require("../services/bulkEmail");
const User = require('../models/user.model');

const bulkMailer = new BulkMailer({ transport: credentials.email, verbose: true });

const __mailerOptions = (hash, options) => {
  const companyLogo = client.logoUrl;
  const verificationUrl = `${client.baseUrl}${client.verifyEmail}/${hash}`;
  const template = registrationTemplate(companyLogo, verificationUrl);
  const html = mjml2html(template);

  const mailOptions = options;
  mailOptions['html'] = html.html;
  mailOptions['text'] = 'Hi there!';
  mailOptions['from'] = credentials.email.auth.user;
  mailOptions['subject'] = 'Please verify your email';

  return mailOptions;
}

const __passwordMailerOptions = (string, options) => {
  const companyLogo = client.logoUrl;
  const password = `${string}`;
  const template = passwordTemplate(companyLogo, password);
  const html = mjml2html(template);

  const mailOptions = options;
  mailOptions['html'] = html.html;
  mailOptions['text'] = 'Hi there!';
  mailOptions['from'] = credentials.email.auth.user;
  mailOptions['subject'] = 'Credentials';

  return mailOptions;
}

const __adminPasswordMailerOptions = (string, options) => {
  const companyLogo = client.logoUrl;
  const token = `${string}`;
  const template = adminPasswordTemplate(companyLogo, token);
  const html = mjml2html(template);

  const mailOptions = options;
  mailOptions['html'] = html.html;
  mailOptions['text'] = 'Hi there!';
  mailOptions['from'] = credentials.email.auth.user;
  mailOptions['subject'] = 'Create new password';

  return mailOptions;
}
const __UserIdMailerOptions = (user) => {
  const companyLogo = client.logoUrl;
  const template = userIdTemplate(companyLogo, user.userId);
  const html = mjml2html(template);

  const mailOptions = {};
  mailOptions['html'] = html.html;
  mailOptions['text'] = 'Hi there!';
  mailOptions['from'] = credentials.email.auth.user;
  mailOptions['subject'] = 'Your unique user id for the platform';
  mailOptions['to'] = user.email;

  return mailOptions;
}

exports.sendVerificationEmail = (hash, options) => {
  const mailerOptions = __mailerOptions(hash, options);
  bulkMailer.send(mailerOptions, true, (error, result) => { // arg1: mailinfo, agr2: parallel mails, arg3: callback
    if (error) {
      console.error(error);
    } else {
      console.info(result);
    }
  });
}

exports.sendPasswordEmail = (password, options) => {
  const mailerOptions = __passwordMailerOptions(password, options);
  bulkMailer.send(mailerOptions, true, (error, result) => { // arg1: mailinfo, agr2: parallel mails, arg3: callback
    if (error) {
      console.error(error);
    } else {
      console.info(result);
    }
  });
}

exports.sendAdminPasswordEmail = (token, options) => {
  const mailerOptions = __adminPasswordMailerOptions(token, options);
  bulkMailer.send(mailerOptions, true, (error, result) => { // arg1: mailinfo, agr2: parallel mails, arg3: callback
    if (error) {
      console.error(error);
    } else {
      console.info(result);
    }
  });
}
exports.verifyUserEmail = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const user = await User.verifyEmail(userId);
    if(user) {
      const mailerOptions = __UserIdMailerOptions(user);
      bulkMailer.send(mailerOptions, true, (error, result) => { // arg1: mailinfo, agr2: parallel mails, arg3: callback
        if (error) {
          console.error(error);
        } else {
          console.info(result);
        }
      });
    return res.send('Thank you for verification. An email with your unique id for the platform has been sent to your email address');
    }
    return res.send('Some error occurred. Please try again later')
  } catch (err) {
    return next(err);
  }
}

exports.verifyMobileOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const message = await User.verifyMobileOtp(email, otp);
    return res.send(message);
  } catch(err) {
    return next(err);
  }
}