
const ChatRoom = require('../models/chatRoom.model');
const Cryptr = require('cryptr');

// define constructor function that gets `io` send to it
module.exports = function (io) {
    io.on('connection', function (socket) {
        console.log("User Connected in chat room ");


        // Chat creating & updation from here ------------------------------------
        socket.on('message', async function (data) {
            //encrypting data with transaction ID -----------
            const crypr = new Cryptr(data.transactionId);

            const encryptedString = crypr.encrypt(data.messages[0].Message);

            let chatRoomExixts = await ChatRoom.find({ transactionId: data.transactionId, user1: data.user1, user2: data.user2 })

            if (!chatRoomExixts.length) {
                await ChatRoom.create({
                    transactionId: data.transactionId,
                    roomName: data.roomName,
                    orderType: data.orderType,
                    user1: data.user1,
                    user2: data.user2,
                    admin: data.admin
                })
            }

            let chatRoomData = await ChatRoom.findOneAndUpdate({
                transactionId: data.transactionId,
                // roomName: data.roomName,
                // orderType: data.orderType,
                user1: data.user1,
                user2: data.user2,
                // admin: data.admin
            }, {
                $push: {
                    messages: {
                        Message: encryptedString,
                        MessageFrom: data.messages[0].MessageFrom,
                        MessageFromEmail: data.messages[0].MessageFromEmail,
                        isread: data.messages[0].isread,
                        adminread: data.messages[0].adminread
                    }
                }
            }, {
                // upsert: true,
                new: true
            })

            //decypting messages----------------------------------
            try {
                for (let i = 0; i < chatRoomData.messages.length; i++) {
                    let decryptedString = crypr.decrypt(chatRoomData.messages[i].Message);
                    chatRoomData.messages[i].Message = decryptedString;
                }
            } catch (error) { }

            //console.log("From Message", chatRoomData);
            socket.broadcast.emit('message', chatRoomData);
            console.log('outside chatRoomData["includeAdmin"] on sending msg');
            console.log('Value of includeAdmin :', chatRoomData.includeAdmin, 'line 62 of ================================', chatRoomData);
            if (chatRoomData.includeAdmin) {
                socket.broadcast.emit('messageAdmin', { chatRoomData: [chatRoomData], transactionId: chatRoomData.transactionId });
                console.log('inside chatRoomData["includeAdmin"] on sending msg');
            }


        });


        // Get all privious messeges if exist -------------------
        socket.on('getMessage', async function (data) {

            const crypr = new Cryptr(data.transactionId);

            let chatRoomData = await ChatRoom.findOne({ transactionId: data.transactionId, user1: data.user1, user2: data.user2 }, { _id: 0 }).sort({ createdAt: -1 });

            //decypting messages----------------------------------
            try {
                for (let i = 0; i < chatRoomData.messages.length; i++) {
                    let decryptedString = crypr.decrypt(chatRoomData.messages[i].Message);
                    chatRoomData.messages[i].Message = decryptedString;
                }
            } catch (error) { }

            // console.log("From getMessage", chatRoomData);
            socket.emit('message', chatRoomData);

        })


        // Get all privious messeges if exist ------------------------------------------------------
        socket.on('checkRooms', async function (data) {

            //console.log("From checkRooms id", data.transactionId);

            const crypr = new Cryptr(data.transactionId);

            let chatRoomData = await ChatRoom.find({ transactionId: data.transactionId, $or: [{ user1: data.user1 }, { user2: data.user1 }] }, { _id: 0 });

            // console.log("From checkRooms before", chatRoomData);


            try {

                chatRoomData.forEach((data) => {

                    //decypting messages----------------------------------

                    for (let i = 0; i < data.messages.length; i++) {
                        data.messages[i].Message = crypr.decrypt(data.messages[i].Message);
                    }
                })
            } catch (error) { }


            //console.log("From checkRooms after", chatRoomData);
            socket.emit('ChatRoom', chatRoomData);

        })


        // Update all messages user -----------------------------
        socket.on('updateReadStatus', async function (data) {

            let chatRoomData = await ChatRoom.findOne({ transactionId: data.transactionId, user1: data.user1, user2: data.user2 });

            // chatRoomData.forEach(function (room) {
            chatRoomData.messages.forEach(function (msg) {
                console.log("All Messages", msg);

                // if (msg.isread === false) {
                msg.isread = true;
                msg.adminread = true
                // }
            });

            // })

            await ChatRoom.findOneAndUpdate({ transactionId: data.transactionId, user1: data.user1, user2: data.user2 }, chatRoomData)
            // {
            //     $set:{"messages.$[].isread":true}},
            // { multi: true })

            // chatRoomData.messages.forEach(function (msg) {
            //     // console.log("All Messages",msg);

            //     // if (msg.isread === false) {
            //         msg.isread = true;
            //     // }
            // });
            // await chatRoomData.save();

            console.log("mess", chatRoomData.messages);


            //  //decypting messages----------------------------------
            //  try {
            //     for (let i = 0; i < chatRoomData.messages.length; i++) {
            //         let decryptedString = crypr.decrypt(chatRoomData.messages[i].Message);
            //         chatRoomData.messages[i].Message = decryptedString;
            //     }
            // } catch (error) { }

            // socket.broadcast.emit('message', chatRoomData);

        })


        //Admin API fron here --------------------------------------------------------------------------------------
        // Get all privious chatrooms available for perticular transaction if exist -------------------
        socket.on('getChatroomsAdmin', async function (data) {

            const crypr = new Cryptr(data.transactionId);

            let chatRoomData = await ChatRoom.find({ transactionId: data.transactionId }, { _id: 0 });
            console.log('chatroom line 183', chatRoomData);
            if (chatRoomData) {
                chatRoomData.forEach((data) => {
                    if (data['includeAdmin']) {
                        try {
                            for (let i = 0; i < data.messages.length; i++) {
                                let decryptedString = crypr.decrypt(data.messages[i].Message);
                                data.messages[i].Message = decryptedString;
                            }
                        } catch (error) { }
                    }
                    else {
                        data.messages = []
                    }
                })
                socket.emit('messageAdmin', { chatRoomData: chatRoomData, transactionId: data.transactionId, user1: data.user1, user2: data.user2 });
            }
            else {
                socket.emit('messageAdmin', { chatRoomData: chatRoomData, transactionId: data.transactionId, user1: data.user1, user2: data.user2 });
            }
            //decypting messages----------------------------------


        })


        // Update all messages Admin status -----------------------------
        socket.on('updateReadStatusAdmin', async function (data) {

            let chatRoomData = await ChatRoom.findOne({ transactionId: data.transactionId, user1: data.user1, user2: data.user2 });

            chatRoomData.messages.forEach(function (msg) {
                // console.log("All Messages",msg);

                if (msg.adminread === false) {
                    msg.adminread = true;

                }
                msg.isread = true
            });

            chatRoomData.save();

        })

        // Notify to Admin from here (showing notification to user) -----------------------------
        socket.on('showAdminNotification', async function (data) {

            let chatRoomData = await ChatRoom.findOne({ transactionId: data.transactionId, user1: data.user1, user2: data.user2 });
            console.log('chatroomvalue line 225:', chatRoomData);

            if (chatRoomData) {
                console.log('inside if chatroom line 227 :', chatRoomData);
                chatRoomData['includeAdmin'] = true;
                console.log('chatroom line 229 :', chatRoomData);
                await ChatRoom
                    .updateOne({ _id: chatRoomData._id }, { $set: chatRoomData })
                console.log('chatroom line 231 :', chatRoomData);
                chatRoomData.messages.forEach(function (msg) {
                    // console.log("All Messages",msg);

                    if (msg.adminread === true) {
                        msg.adminread = false;
                    }
                });
                chatRoomData = await chatRoomData.save();

                //decypting messages----------------------------------
                try {
                    for (let i = 0; i < chatRoomData.messages.length; i++) {
                        let decryptedString = crypr.decrypt(chatRoomData.messages[i].Message);
                        chatRoomData.messages[i].Message = decryptedString;
                    }
                } catch (error) { }
            }
            console.log('chatroomvalue line 249:', chatRoomData);
            socket.broadcast.emit('messageAdmin', { chatRoomData: [chatRoomData], transactionId: data.transactionId });

        })

        // Get all transaction data initially to show notification on Admin side -----------------------------
        socket.on('getAllChatData', async function () {

            let chatRoomData = await ChatRoom.find({});

            //decypting messages----------------------------------
            try {
                for (let i = 0; i < chatRoomData.messages.length; i++) {
                    let decryptedString = crypr.decrypt(chatRoomData.messages[i].Message);
                    chatRoomData.messages[i].Message = decryptedString;
                }
            } catch (error) { }

            socket.emit('getAllChatData', chatRoomData);

        })


    });

};