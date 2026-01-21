const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  totalDeposited: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  totalRentEarned: {
    type: Number,
    default: 0
  },
  totalInvested: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lastTransaction: {
    type: Date
  }
}, {
  timestamps: true
});

// Method to add funds
walletSchema.methods.addFunds = async function(amount, description = 'Deposit') {
  this.balance += amount;
  this.totalDeposited += amount;
  this.lastTransaction = new Date();
  await this.save();
  return this;
};

// Method to deduct funds
walletSchema.methods.deductFunds = async function(amount, description = 'Withdrawal') {
  if (this.balance < amount) {
    throw new Error('Insufficient balance');
  }
  this.balance -= amount;
  this.totalWithdrawn += amount;
  this.lastTransaction = new Date();
  await this.save();
  return this;
};

// Method to add rent earnings
walletSchema.methods.addRentEarnings = async function(amount) {
  this.balance += amount;
  this.totalRentEarned += amount;
  this.lastTransaction = new Date();
  await this.save();
  return this;
};

module.exports = mongoose.model('Wallet', walletSchema);
