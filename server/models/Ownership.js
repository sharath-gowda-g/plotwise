const mongoose = require('mongoose');

const ownershipSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  property: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true
  },
  tokensOwned: {
    type: Number,
    required: true,
    min: 1
  },
  purchasePrice: {
    type: Number,
    required: true
  },
  totalInvested: {
    type: Number,
    required: true
  },
  ownershipPercentage: {
    type: Number,
    required: true
  },
  rentEarned: {
    type: Number,
    default: 0
  },
  lastRentPayout: {
    type: Date
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index for unique user-property ownership
ownershipSchema.index({ user: 1, property: 1 }, { unique: true });

// Calculate ownership percentage
ownershipSchema.pre('save', async function(next) {
  if (this.isModified('tokensOwned')) {
    const Property = mongoose.model('Property');
    const property = await Property.findById(this.property);
    if (property) {
      this.ownershipPercentage = (this.tokensOwned / property.totalTokens) * 100;
    }
  }
  next();
});

module.exports = mongoose.model('Ownership', ownershipSchema);
