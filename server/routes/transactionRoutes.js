const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, investorOnly } = require('../middleware/auth');
const {
  buyTokens,
  getTransactions,
  getTransactionById
} = require('../controllers/transactionController');

// Buy tokens validation
const buyTokensValidation = [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('tokens').isInt({ min: 1 }).withMessage('Tokens must be at least 1')
];

// Routes
router.post('/buy-tokens', protect, investorOnly, buyTokensValidation, validate, buyTokens);
router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransactionById);

module.exports = router;
