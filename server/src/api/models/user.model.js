const mongoose = require('mongoose');
const httpStatus = require('http-status');
const {
    omitBy,
    isNil
} = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid');
const APIError = require('../utils/APIError');
const {
    env,
    jwtSecret,
    jwtExpirationInterval,
    url
} = require('../../config/vars');
var shortid = require('shortid');
const Cryptr = require('cryptr');

/**
 * User Roles
 */
const roles = ['user', 'admin', 'subAdmin'];
const gender = ['male', 'female'];
/**
 * User Schema
 * @private
 */
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        // lowercase: true,
        index: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 128,
    },
    lastUpdatedPassword :{
        type :Date
    },
    platform: {
        type: String,
        enum: ['coinPurchase', 'coinBalance', 'cryptoTrade', 'admin'],
        required: true,
    },
    firstName: {
        type: String,
        maxlength: 128,
        trim: true,
    },
    lastName: {
        type: String,
        maxlength: 128,
        trim: true,
    },
    services: {
        facebook: String,
        google: String,
    },
    role: {
        type: String,
        enum: roles,
        default: 'user',
    },
    picture: {
        type: String,
        trim: true,
    },
    documents: [{ }],                       // Id documents like passport, id proof etc.
    dob: {
        type: String,
        trim: true,
    },
    gender: {
        type: String,
        enum: ['male', 'female'],
    },
    mobile: {
        type: String,
        trim: true,
    },
    location: {
        type: String,
        trim: true,
    },
    userId: {
        type: String,
        unique:true,
        default: shortid.generate
    },
    passwordToken: {
        type: String
    },
    emailVerified: {
        type: Boolean,
        default: true,
    },
    mobileVerified: {
        type: Boolean,
        default: true,
    },
    userType: {
        type: String,
        maxlength: 128,
        index: true,
        trim: true,
    },
    status: {
        type: String,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    account: {
        address: String,
        privateKey: String,
        publicKey: String,
        secret: String
    },
    bankAccounts: {
        type: Array
    },
    bankAccount: {
        name: String,
        number: String,
        swift: String,
        btc: String
    },
    createWithoutPassword: {
        type: Boolean,
        default: true
    },
    googleAuth: {
        type: Boolean,
        default: false
    },
    googleAuthKey: {
        type: String
    },
    secretKey: {
        type: String
    },
    country: {
        type: String
    },
    coins: {
        type: Number
    },
    count: {
        type: Number,
        required: true,
        default: 0

    },
    ethPublicKey: {
        type: String,
    },
    ethPrivateKey: {
        type: String,
    },
    status: {
        type: String,
        default: true
    },
    isblock: {
        type: Boolean,
        default: false,

    },
    passKey: {
        type: String,
    },
    jwtToken: {
        type: String,
    },
   
}, {
    timestamps: true,
});

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 * -generate public key from private key
 */
userSchema.pre('save', async function save(next) {
  try {
    if (!this.isModified('password')) return next();

    const rounds = 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;
    this.lastUpdatedPassword = new Date().toISOString();
    return next();
  } catch (error) {
    return next(error);
  }
});
/**
 * Methods
 */
userSchema.method({
    transform() {
        const transformed = {};
        const fields = ['userId', 'uniqueId','ethPublicKey','ethPrivateKey', 'createdAt', 'firstName', 'lastName', 'bankAccounts', 'bankAccount', 'mobile', '_id', 'userType', 'role', 'date', 'email', 'emailVerified', 'isActive', 'secret', 'picture', 'documents', 'googleAuth', 'lastUpdatedPassword', 'account'];

        fields.forEach((field) => {
            transformed[field] = this[field];
        });

        return transformed;
    },

    token() {
        const playload = {
            exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
            iat: moment().unix(),
            sub: this._id,
        };
        return jwt.encode(playload, jwtSecret);
    },

    async passwordMatches(password) {
        return bcrypt.compare(password, this.password);
    },
    async secretKeyMatches(secretKey){
    return cryptr.compare(secretKey,this.secret)
    },
    setRandomPassword(){
        var randomPassword= newUser.generateRandomPassword();
        this.password =randomPassword; 
        console.log(this.password)
    },
    generateRandomPassword() {
        var password = generator.generate({
            length: 10,
            numbers: true
        });
        console.log(password)
        return password;
    },

});


/**
 * Statics
 */
userSchema.statics = {
    roles,

    /**
     * Get user
     *
     * @param {ObjectId} id - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    async get(id) {
        try {
            let user;

            if (mongoose.Types.ObjectId.isValid(id)) {
                user = await this.findById(id).exec();
            }
            if (user) {
                return user;
            }

            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (error) {
            throw error;
        }
    },
    /**
     * Find user by email and tries to generate a JWT token
     *
     * @param {ObjectId} id - The objectId of user.
     * @returns {Promise<User, APIError>}
     */
    async findAndGenerateToken(options) {
        const {
            email,
            password,
            refreshObject
        } = options;
        if (!email) throw new APIError({
            message: 'An email is required to generate a token'
        });

        const user = await this.findOne({
            email
        }).exec();
        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };
        if (password) {
            if (user && await user.passwordMatches(password)) {
                return {
                    user,
                    accessToken: user.token()
                };
            }
            err.message = 'Incorrect email or password';
        } else if (refreshObject && refreshObject.userEmail === email) {
            if (moment(refreshObject.expires).isBefore()) {
                err.message = 'Invalid refresh token.';
            } else {
                return {
                    user,
                    accessToken: user.token()
                };
            }
        } else {
            err.message = 'Incorrect email or refreshToken';
        }
        throw new APIError(err);
    },

    async findUserIdAndGenerateToken(options) {
        const {
            userId,
            refreshObject
        } = options;
        if (!userId) throw new APIError({
            message: 'An user id is required to generate a token'
        });

        const user = await this.findOne({
            userId
        }).exec();
        const err = {
            status: httpStatus.UNAUTHORIZED,
            isPublic: true,
        };
        if (refreshObject && refreshObject.userEmail === user.email) {
            if (moment(refreshObject.expires).isBefore()) {
                err.message = 'Invalid refresh token.';
            } else {
                return {
                    user,
                    accessToken: user.token()
                };
            }
        } else if (user) {
            return {
                user,
                accessToken: user.token()
            };
        }
        throw new APIError(err);
    },

    /**
     * List users in descending order of 'createdAt' timestamp.
     *
     * @param {number} skip - Number of users to be skipped.
     * @param {number} limit - Limit number of users to be returned.
     * @returns {Promise<User[]>}
     */
    list({
        page = 1,
        perPage = 30,
        name,
        email,
        role,
    }) {
        const options = omitBy({
            name,
            email,
            role
        }, isNil);

        return this.find(options)
            .sort({
                createdAt: -1
            })
            .skip(perPage * (page - 1))
            .limit(perPage)
            .exec();
    },

    /**
     * Return new validation error
     * if error is a mongoose duplicate key error
     *
     * @param {Error} error
     * @returns {Error|APIError}
     */
    checkDuplicateEmail(error) {
        if (error.name === 'MongoError' && error.code === 11000) {
            return new APIError({
                message: 'Validation Error',
                errors: [{
                    field: 'email',
                    location: 'body',
                    messages: ['"email" already exists'],
                }],
                status: httpStatus.CONFLICT,
                isPublic: true,
                stack: error.stack,
            });
        }
        return error;
    },

    async oAuthLogin({
        service,
        id,
        email,
        name,
        picture,
    }) {
        const user = await this.findOne({
            $or: [{
                [`services.${service}`]: id
            }, {
                email
            }]
        });
        if (user) {
            user.services[service] = id;
            if (!user.name) user.name = name;
            if (!user.picture) user.picture = picture;
            return user.save();
        }
        const password = uuidv4();
        return this.create({
            services: {
                [service]: id
            },
            email,
            password,
            name,
            picture,
        });
    },

    async verifyEmail(userId) {
        if (!userId) throw new APIError({
            message: 'No token found for verification'
        });
        try {
            const user = await this.findOneAndUpdate({
                userId
            }, {
                emailVerified: true
            }).exec();

            if (user) {
                return user;
            }
            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (err) {
            throw new APIError(err);
        }
    },

    async verifyMobileOtp(email, otp) {
        if (!email || !otp) throw new APIError({
            message: 'Can not verify otp due to insufficient information',
            status: httpStatus.BAD_REQUEST
        });

        try {
            const {
                verify
            } = require('../services/otpAuth');
            const user = await this.findOneAndUpdate({
                email
            }, {
                mobileVerified: true
            }).exec();
            if (user && verify(email, otp)) {
                return {
                    message: 'OTP verified'
                };
            }
            throw new APIError({
                message: 'OTP did not match',
                status: httpStatus.NOT_FOUND,
            });
        } catch (err) {
            throw new APIError(err);
        }
    },

    async FindOneAndUpdate(query, update) {
        try {
            const user = await this.findOneAndUpdate(query, update).exec();
            if (user) {
                return user
            }

            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (err) {
            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.BAD_REQUEST,
            });
        }
    },
     async FindOneAndBlockUser(query, update) {
        try {
            const user = await this.findOneAndUpdate(query, update).exec();
            if (user) {
                return user
            }

            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (err) {
            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.BAD_REQUEST,
            });
        }
    },


    async FindOne(query) {
        try {
            const user = await this.findOne(query).exec();
       
            if (user) {
       
                return user
            }

            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.NOT_FOUND,
            });
        } catch (err) {
            throw new APIError({
                message: 'User does not exist',
                status: httpStatus.BAD_REQUEST,
            });
        }
    },
};



/**
 * @typedef User
 */
module.exports = mongoose.model('User', userSchema);