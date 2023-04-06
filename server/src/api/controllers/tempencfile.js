const Cryptr = require('cryptr');
const cryptr = new Cryptr('secretCode123');
 
const encryptedString = cryptr.encrypt('trim yard dutch sorry fault meat present seek seven salad transfer awful');
const decryptedString = cryptr.decrypt(encryptedString);
 
console.log("ENC : ",encryptedString); // 5590fd6409be2494de0226f5d7
//console.log(decryptedString); // bacon