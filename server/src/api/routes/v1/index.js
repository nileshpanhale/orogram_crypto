const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const verificationRoutes = require('./verify.route');
const generationRoutes = require('./generate.route');
const adminRoutes= require('./admin.route')
const enqueryRoutes = require('./enquery.route');
const transferMoneyRoutes = require('./transferMoney.route');
const trancationRoutes = require('./transaction.route');
const trancationContractRoutes = require('./transactionContract.route');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/verify', verificationRoutes);
router.use('/generate', generationRoutes);
router.use('/enquery', enqueryRoutes);
router.use('/moneyTransfer', transferMoneyRoutes);
router.use('/transactions', trancationRoutes);
router.use('/transactionscontract', trancationContractRoutes);

router.use('/admin',adminRoutes)
module.exports = router;
