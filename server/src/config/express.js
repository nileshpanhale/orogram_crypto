const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const compress = require('compression');
const methodOverride = require('method-override');
const cors = require('cors');
const helmet = require('helmet');
const passport = require('passport');

const { logs, uploadFolderPath, uploadImagePath } = require('./vars');
const strategies = require('./passport');
const error = require('../api/middlewares/error');
const fs = require('fs');
var http = require('http');
const app = express();
var server = http.createServer(app);
var io = require('socket.io')(server, { cors: { origin: "*" } });
// const apple = require(".././api/services/chatroom.js");
// apple.send_from_another_js_1(io);
const routes = require('../api/routes/v1');
const ContractExpiryService = require('../api/services/contractExpiryCheckService');

// io.set("origins", "*:*");

//exporting socket file to use in another routes ----------------------------------
// load chatroom.js and pass it the socket.io object
require('../api/services/chatroom.js')(io);

// Creating uploads folder if does not exist
if (!fs.existsSync(uploadFolderPath)){
    fs.mkdirSync(uploadFolderPath);
    if( !fs.existsSync(uploadImagePath)) {
        fs.mkdirSync(uploadImagePath);
    }
} else {
    if( !fs.existsSync(uploadImagePath)) {
        fs.mkdirSync(uploadImagePath);
    }
}

/**
* Express instance
* @public
*/

app.use(express.static('../public'))

// enable CORS - Cross Origin Resource Sharing
// app.use(cors(corsOptionsDelegate));
app.use(cors())

//allow CORS
app.use(function(req, res, next) {

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Length,  X-Requested-With, Content-Type, Accept, Authorization, request-node-status");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, HEAD, PUT, PATCH, DELETE");
    next();
});



// static path for hosted files
app.use( '/v1/assets', express.static(uploadFolderPath));

// request logging. dev: console | production: file
// app.use(morgan(logs));

// app.use(express.json({limit: '50mb'}));
// app.use(express.urlencoded({limit: '50mb'}));
// parse body params and attache them to req.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json({limit:'50mb'})); 
// app.use(bodyParser.urlencoded({extended:true, limit:'50mb'}));


// gzip compression
app.use(compress());

// lets you use HTTP verbs such as PUT or DELETE
// in places where the client doesn't support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());



//started contract check service --------------------------====================================
ContractExpiryService.task.start();


// enable authentication
app.use(passport.initialize());
passport.use('jwt', strategies.jwt);
passport.use('facebook', strategies.facebook);
passport.use('google', strategies.google);

app.get('/', (req, res) => {
    res.send("Cryptogold Api running");
})
// mount api v1 routes
app.use('/v1', routes);

// if error is not an instanceOf APIError, convert it.
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);


io.on('connection', function(socket){   
    if(socket) {
        // socket.on('newnotification',(data) =>{   
        //     socket.broadcast.emit('newnotification',data);
        //   });
          socket.on('usernotification',(data)=>{
            socket.broadcast.emit('usernotification',data);
            socket.broadcast.emit('newnotification',data);
          });
        //   socket.on('newnotification',(data)=>{
        //     socket.broadcast.emit('newnotification',data);

        //   });


    } else {
        console.log("socket disconnected...");
        console.log("Socket connected status : ", socket.connected);
    }
    
    
});

module.exports = {app,server};
