const mjml2html = require('mjml');
const credentials = require('../../config/credentials');
const client = require('../../config/client');
const thankyouEmail = require('../../templates/email/thankyouEnquery');
const youGotAnEnquery = require('../../templates/email/enquery');
const BulkMailer = require("../services/bulkEmail");
const Enquery = require('../models/enqueries.model');
const Rates = require('../models/goldRate.model')
const httpStatus = require('http-status');
const axios = require('axios');
const CircularJSON = require('circular-json')

const bulkMailer = new BulkMailer({ transport: credentials.email, verbose: true });

const __ThankyouMailerOptions = (to) => {
  const companyLogo = client.logoUrl;
  const template = thankyouEmail(companyLogo);
  const html = mjml2html(template);

  const mailOptions = {};
  mailOptions['html'] = html.html;
  mailOptions['text'] = 'Hi there!';
  mailOptions['from'] = credentials.email.auth.user;
  mailOptions['subject'] = 'Thank you for your enquery';
  mailOptions['to'] = to;

  return mailOptions;
}

const __EnqueryMailerOptions = (name, email, enquery) => {
  const companyLogo = client.logoUrl;
  const template = youGotAnEnquery(companyLogo, name, email, enquery);
  const html = mjml2html(template);

  const mailOptions = {};
  mailOptions['html'] = html.html;
  mailOptions['text'] = 'Hi there!';
  mailOptions['from'] = credentials.email.auth.user;
  mailOptions['subject'] = 'You got an enquery';
  mailOptions['to'] = credentials.ENQUERY_EMAIL;

  return mailOptions;
}

exports.sendEnquery = async (req, res, next) => {
  try {
    const { name, email, enquery } = req.body
    if(!email || !enquery) {
      return res.status(httpStatus.NOT_ACCEPTABLE).send({ message: 'Email or enquery not found' });
    }
  	const mailerOptions = __ThankyouMailerOptions(email);
    const enquiryMailerOptions = __EnqueryMailerOptions(name, email, enquery);
    bulkMailer.send(mailerOptions, true, (error, result) => {
      if (error) {
        console.error(error);
        res.status(httpStatus.NOT_ACCEPTABLE);
      } else {
        console.info(result);
        bulkMailer.send(enquiryMailerOptions, true, async (error, result) => {
          if (error) {
            console.error(error);
            res.status(httpStatus.NOT_ACCEPTABLE);
          } else {
            console.info(result);
            const enquery = new Enquery(req.body);
            const savedEnquery = await enquery.save();
            res.status(httpStatus.CREATED);
          }
        });
      }
    });
    return res.status(httpStatus.CREATED).send('query successfully submitted');
  } catch (err) {
    return next(err);
  }
}

exports.fetchRates = async (req, res, next) => {                     // MOVED TO INDEX.JS

  let data = await Rates.findOne()  

  axios.all([
    axios.get('https://www.goldapi.io/api/XAU/EUR', {
            headers: {
                'x-access-token': 'goldapi-dcr4a8tkumf28hd-io'
            }
            }),
        axios.get('http://data.fixer.io/api/latest?access_key=f778e9e75d6256278a7f22cec2cad8df&symbol=EUR')
  ])
  .then(axios.spread(async (goldres, currencyData) => {

      //Converting troy ounce to gram = data.Mid/31.1034768
      var bitoroPrice =  Math.round(goldres.data.Mid/31.1034768)  ;        // Price of 1 BITORO in EUR
      
      let body = {
        gold : bitoroPrice, 
        currency: currencyData.data
      }

      if (!data) {
        const rates = new Rates(body);
        await (rates).save();
      } else {
        await Rates.findOneAndUpdate({_id: data._id},  { $set: body })
      }

      return res.status(200).send({"goldprice":bitoroPrice, rates: currencyData.data.rates});
  }));
}

// exports.goldBtcAPI = async (req, res, next) => {

//   axios.all([
//     // axios.get('https://globalmetals.xignite.com/xGlobalMetals.json/GetRealTimeMetalQuote?Symbol=XAU&Currency=USD&_token=A823B7CD69E84EE1915AC0C531EEDC96'),
//     axios.get('https://globalmetals.xignite.com/xGlobalMetals.json/GetRealTimeMetalQuote?Symbol=XAU&Currency=EUR&_token=A823B7CD69E84EE1915AC0C531EEDC96'),
//     axios.get('https://api.coindesk.com/v1/bpi/currentprice.json')
//   ])
//   .then(axios.spread((goldres, BTCres) => {


//     //Converting troy ounce to gram = data.Mid/31.1034768
//     var bitoroPrice =  Math.round(goldres.data.Mid/31.1034768)  ;        // Price of 1 BITORO in EUR


//     var btceur = Number(BTCres.data.bpi.EUR.rate.replace(/,/g, '')) ;    // Price of 1 BTC in EUR

//     var bitorobtc = Number.parseFloat(1/(btceur/parseInt(bitoroPrice))).toPrecision(8) ; // Price of 1 Bitoro in btc
//     // var bitorobtc = parseInt(btceur)/parseInt(bitoroPrice);

//     // console.log("btceurhh", Math.round(parseFloat(BTCres.data.bpi.USD.rate.replace(/,/g, ''))));
//     // console.log("btceur",btceur);

//     // console.log("bitoroPrice",bitoroPrice);

//     // console.log("bitorobtc",Number.parseFloat(bitorobtc).toPrecision(8));

    

//     return res.status(200).send({"goldprice":bitoroPrice, "btcprice": btceur, "bitorobtc":Number(bitorobtc)});
//   }
//   ));
// }

exports.goldBtcAPI = async (req, res, next) => {

  let goldPrice = await Rates.findOne()
  let bitoroPrice = goldPrice.gold

  let BTCres = await axios.get('https://api.coindesk.com/v1/bpi/currentprice.json')

  var btceur = Number(BTCres.data.bpi.EUR.rate.replace(/,/g, '')) ;    // Price of 1 BTC in EUR
  var bitorobtc = Number.parseFloat(1/(btceur/parseInt(bitoroPrice))).toPrecision(8) ; // Price of 1 Bitoro in btc

  console.log("goldprice: ", goldPrice.gold, "btcprice : ", btceur, "bitorobtc : ",Number(bitorobtc)) ;
console.log("goldBtcAPI response.");
  return res.status(200).send({"goldprice":bitoroPrice, "btcprice": btceur, "bitorobtc":Number(bitorobtc)});
  
}

exports.currencyRate = async (req, res, next) => {
  
  try {
    // let data = await axios.get('http://data.fixer.io/api/latest?access_key=5619dacb36f2497070db22ba54f9301a&format=1')
        
    let exchangeRates = await Rates.findOne()
    console.log(exchangeRates, "Currency exchange rates.");
    
    return res.status(200).send({data: exchangeRates.currency})

  } catch (err) {
    return res.status(500).send({err: err.message})
  }


}
