var speakeasy = require("speakeasy");
var secret = speakeasy.generateSecret({length: 20});

exports.generate = (email) => {
	var token = speakeasy.totp({
	  secret: email,
	  time: parseInt((Date.now() + 10*1000)/1000) // specified in seconds
	});

	return token;
};
exports.verify = (email, otp) => {
	const val = speakeasy.totp.verify({
	  secret: email,
	  token: otp,
	  time: Date.now()/1000
	});
	return val;
};