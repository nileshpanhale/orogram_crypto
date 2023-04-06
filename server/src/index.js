// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, env } = require('./config/vars');
const { app, server } = require('./config/express');
const mongoose = require('./config/mongoose');

const axios = require('axios');
const cron = require("node-cron");

const Rates = require('../src/api/models/goldRate.model');
//const BitoroRate = require('../src//api/models/bitoroPrice.model');


// open mongoose connection
mongoose.connect();


cron.schedule("*/1 * * * *", async function () {

    let data = await Rates.findOne();

    axios.all([
        //axios.get('https://globalmetals.xignite.com/xGlobalMetals.json/GetRealTimeMetalQuote?Symbol=XAU&Currency=EUR&_token=5C1B71D7A4DF4DF1AA42AB5E0A95892F'),
        axios.get('https://www.goldapi.io/api/XAU/EUR', {
            headers: {
                'x-access-token': 'goldapi-dcr4a8tkumf28hd-io'
            }
        }),
        axios.get('http://data.fixer.io/api/latest?access_key=f778e9e75d6256278a7f22cec2cad8df&symbol=EUR')
    ])
        .then(axios.spread(async (goldres, currencyData) => {           // goldres returns price of gold for troy ounces
            // console.log("data---------------",  goldres.data)
            // var bitoroPrice =  Math.round(goldres.data.Mid/31.1034768)  ;        // Price of 1 BITORO in EUR
            var bitoroPrice = (goldres.data.price / 31.1035).toFixed(2);        // Price of 1 BITORO in EUR
            let body = {
                gold: bitoroPrice,
                currency: currencyData.data
            }

            let BTCres = await axios.get('https://api.coindesk.com/v1/bpi/currentprice.json');
            body.btcprice = Number(BTCres.data.bpi.EUR.rate.replace(/,/g, ''));    // Price of 1 BTC in EUR
            body.bitorobtc = Number(Number.parseFloat(1 / (body.btcprice / parseInt(bitoroPrice))).toPrecision(8)); // Price of 1 Bitoro in btc

            if (!data) {
                const rates = new Rates(body);
                await (rates).save();
            } else {
                await Rates.findOneAndUpdate({ _id: data._id }, { $set: body })
            }
        }));
});



// listen to requests
server.listen(port, () => console.info(`server started on port ${port} (${env})`));

/**
* Exports express
* @public
*/
module.exports = app;
