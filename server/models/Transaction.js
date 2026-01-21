const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property'
  },
  transactionType: {
    type: String,
    enum: ['token_purchase', 'token_sale', 'rent_payout', 'wallet_deposit', 'wallet_withdrawal'],
    required: true
  },
  tokens: {
    type: Number,
    default: 0
  },
  amount: {
    type: Number,
    required: true
  },
  pricePerToken: {
    type: Number
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'card', 'bank_transfer', 'system'],
    default: 'wallet'
  },
  paymentDetails: {
    cardLast4: String,
    bankName: String,
    transactionId: String
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  description: {
    type: String
  },
  balanceBefore: {
    type: Number
  },
  balanceAfter: {
    type: Number
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for efficient queries
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ property: 1, transactionType: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
