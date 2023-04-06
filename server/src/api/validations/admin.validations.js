const Joi = require('joi');
const User = require('../models/user.model');

module.exports = {

  // POST /v1/admin/createUser
  createUser: {
    body: {
      email: Joi.string().email().required(),
      role: Joi.string().valid(User.roles),
    },
  },
};
