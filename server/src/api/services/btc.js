// const express = require('express');
// const bitcore = require('bitcore-lib');


// async function btcWallet() {
//     const buffer = bitcore.crypto.Random.getRandomBuffer(256);
//     const hash = bitcore.crypto.Hash.sha256(buffer);
//     const bn = bitcore.crypto.BN.fromBuffer(hash);
//     const pk = new bitcore.PrivateKey(bn).toWIF();
//     const address = new bitcore.PrivateKey(bn).toAddress() + '';

//     // let wallet = ({
//     //     address: address,
//     //     privateKey: pk
//     // })

//     // console.log(wallet);
//     return { address, pk };
// };

// module.exports = { btcWallet };