const mongoose = require('mongoose');
const crypto = require('crypto');
const moment = require('moment-timezone');

/**
 * Refresh Token Schema
 * @private
 */
const chatRoomSchema = new mongoose.Schema({
 
  roomName: {
    type: String,
    required: true,
  },

  orderType: {
    type: String,
    required: true,
  },

  transactionId: {
    type: String,
    required: true,
  },

  user1: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  user2: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  messages: [{
		Message: { type: String, trim: true },
    MessageFrom: String,
    MessageFromEmail: String,
    isread: {
      type:Boolean,
      default:false,
      required:true
    },
    adminread: {
      type:Boolean,
      default:false,
      required:true
    },
    isself: {
      type:Boolean,
      default:false,
      required:true
    },
    createdAt:{
      type: Date,
      default:new Date()
    } 
  }],
  
  includeAdmin : {
    type : Boolean,
    default : false
  }

}, {
  timestamps: true,
});


chatRoomSchema.statics = {
  
 
  async FindOne(query) {
    try {
      const chatRoom = await this.findOne(query).exec();

      if(chatRoom) {
        return chatRoom
      }

      throw new APIError({
        message: 'Chat Room does not exist',
        status: httpStatus.NOT_FOUND,
      });
    } catch(err) {
      throw new APIError({
        message: 'Chat Room does not exist',
        status: httpStatus.BAD_REQUEST,
      });
    }
  },


  
    async FindOneAndUpdate(query) {
      try {
        const chatRoom = await  this.update( { "transactionId" : query.transactionId },{ $push: { "Messages": query.Messages } }).exec();
        //const chatRoom = await this.findOneAndUpdate(query).exec();
  
        if(chatRoom) {
          return chatRoom
        }
  
        throw new APIError({
          message: 'Chat Room users does not exist',
          message: 'Chat Room does not exist',
          status: httpStatus.NOT_FOUND,
        });
      } catch(err) {
        throw new APIError({
          message: 'Chat Room users does not exist',
          message: 'Chat Room does not exist',
          status: httpStatus.BAD_REQUEST,
        });
      }
    }
  
  
}
const chatRoom = mongoose.model('chatRoom', chatRoomSchema);
module.exports = chatRoom;
