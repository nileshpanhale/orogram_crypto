var cron = require('node-cron');
const Transaction = require('../models/transactionsContract.model');
const chargesService = require('../../../../server/src/api/services/chargesTranceferService');

var datetime = new Date();

module.exports.task = cron.schedule('0 0 */12 * * *', () => {
    console.log('running a task every 1 min');

    //getting current date & converting in yyyy-mm-dd -----------
    let datetimeCurrent = new Date().toISOString().split('T')[0];
    console.log(datetimeCurrent);

    //calling ------
    getTran();

    async function getTran() {

        //getting all transactions ---------------------------------------
        let transaction = await Transaction.find({ contractDate: { $lt: (new Date()).getTime() }, $or: [{ sender: { $exists: true }, receiver: null }, { receiver: { $exists: true }, sender: null }] });

        // checking if transaction not confirmed & CANCELLED ----------------, 
        transaction.forEach(function (result) {

            getTran2();

            async function getTran2() {

                //removing holded coins form admin account on Dispute --------------------
                await chargesService.releaseHoldCharges(result._id);

                //Return funds from admin to user (creater of contract)
                let updatedTransaction = await Transaction.findByIdAndUpdate(result._id, {
                    status: "expired"
                });
                if (updatedTransaction) {
                    console.log("transaction updated succesfully");
                }
            }
        });
    }
});
