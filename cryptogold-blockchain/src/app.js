const express = require('express');
const app = express();
const contractRoute = require('./contract');

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, PATCH, DELETE, OPTIONS");
    next();
})
app.use('/contract', contractRoute);

/**
 * responce to server if wrong request received to server
 */
app.use((req, res, next) => {
    res.status(404).json({
        err: 'request not found'
    });
});

module.exports = app;   