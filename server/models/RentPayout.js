const mongoose = require('mongoose');

const rentPayoutSchema = new mongoose.Schema({
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  totalRentCollected: {
    type: Number,
    required: true
  },
  payoutMonth: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  payoutYear: {
    type: Number,
    required: true
  },
  rentPerToken: {
    type: Number,
    required: true
  },
  distributions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tokensHeld: Number,
    amountPaid: Number,
    paidAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalDistributed: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Compound index for unique monthly payouts per property
rentPayoutSchema.index({ property: 1, payoutMonth: 1, payoutYear: 1 }, { unique: true });

module.exports = mongoose.model('RentPayout', rentPayoutSchema);
