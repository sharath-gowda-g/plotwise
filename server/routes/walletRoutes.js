const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getWallet,
  depositFunds,
  withdrawFunds,
  getWalletTransactions
} = require('../controllers/walletController');

// Validation rules
const depositValidation = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1')
];

const withdrawValidation = [
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be at least $1')
];

// Routes
router.get('/', protect, getWallet);
router.post('/deposit', protect, depositValidation, validate, depositFunds);
router.post('/withdraw', protect, withdrawValidation, validate, withdrawFunds);
router.get('/transactions', protect, getWalletTransactions);

module.exports = router;
