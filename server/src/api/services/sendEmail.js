var nodemailer = require("nodemailer");
var credentials = require("../../config/credentials");

var smtpTransport = nodemailer.createTransport(credentials.nodemailer);

exports.sendMail = function(mailOptions) {
  smtpTransport.sendMail(mailOptions, function(error, response) {
    if (error) {
      return new Error(error);
    } else {
      return response;
    }
  });
}
