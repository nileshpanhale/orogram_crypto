const mongoose = require('mongoose');

var connection = mongoose.createConnection("mongodb://localhost/CryptoGold");



const incrementSchema = new mongoose.Schema({
    sequence_name: String,
    sequence_value:000
});


const increment = mongoose.model('IncrementSchema', incrementSchema);
module.exports = increment;

