const Joi = require('joi');

module.exports = {
  // POST /v1/auth/register
  register: {
    body: {
      password: Joi.string().required(),
    },
  },

  // POST /v1/auth/login
  login: {
    body: {
      email: Joi.string().required(),
      password: Joi.string().required().max(128),
    },
  },

  // POST /v1/auth/login
  loginWithUserId: {
    body: {
      userId: Joi.string().required().max(10),
    },
  },

  // POST /v1/auth/resendVerificationEmail
  resendVerificationEmail: {
    body: {
      email: Joi.string().email().required(),
    },
  },

  // POST /v1/auth/facebook
  // POST /v1/auth/google
  oAuth: {
    body: {
      access_token: Joi.string().required(),
    },
  },

  // POST /v1/auth/refresh
  refresh: {
    body: {
      email: Joi.string().email().required(),
      refreshToken: Joi.string().required(),
    },
  },

  // POST /v1/auth/2fAuth
  loginWithGoogleCode: {
    body: {
      email: Joi.string().email().required(),
      code: Joi.number().required(),
    },
  },
};
