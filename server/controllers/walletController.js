const { Wallet, Transaction } = require('../models');
const mongoose = require('mongoose');

// @desc    Get user's wallet
// @route   GET /api/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id });
    }

    res.json(wallet);
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Deposit funds (Mock payment)
// @route   POST /api/wallet/deposit
// @access  Private
const depositFunds = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, paymentMethod = 'card' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid deposit amount' });
    }

    if (amount > 100000) {
      return res.status(400).json({ message: 'Maximum deposit amount is $100,000' });
    }

    let wallet = await Wallet.findOne({ user: req.user._id }).session(session);
    if (!wallet) {
      wallet = await Wallet.create([{ user: req.user._id }], { session });
      wallet = wallet[0];
    }

    const balanceBefore = wallet.balance;
    wallet.balance += amount;
    wallet.totalDeposited += amount;
    wallet.lastTransaction = new Date();
    await wallet.save({ session });

    // Create transaction record
    const transaction = await Transaction.create([{
      user: req.user._id,
      transactionType: 'wallet_deposit',
      amount: amount,
      paymentMethod: paymentMethod,
      paymentDetails: {
        cardLast4: '4242', // Mock card
        transactionId: `DEP_${Date.now()}`
      },
      status: 'completed',
      description: `Deposited $${amount.toFixed(2)} via ${paymentMethod}`,
      balanceBefore: balanceBefore,
      balanceAfter: wallet.balance
    }], { session });

    await session.commitTransaction();

    res.json({
      message: 'Funds deposited successfully',
      transaction: transaction[0],
      newBalance: wallet.balance
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Deposit error:', error);
    res.status(500).json({ message: 'Server error during deposit' });
  } finally {
    session.endSession();
  }
};

// @desc    Withdraw funds (Mock)
// @route   POST /api/wallet/withdraw
// @access  Private
const withdrawFunds = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { amount, bankDetails } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid withdrawal amount' });
    }

    const wallet = await Wallet.findOne({ user: req.user._id }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (wallet.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    const balanceBefore = wallet.balance;
    wallet.balance -= amount;
    wallet.totalWithdrawn += amount;
    wallet.lastTransaction = new Date();
    await wallet.save({ session });

    // Create transaction record
    const transaction = await Transaction.create([{
      user: req.user._id,
      transactionType: 'wallet_withdrawal',
      amount: amount,
      paymentMethod: 'bank_transfer',
      paymentDetails: {
        bankName: bankDetails?.bankName || 'Bank Account',
        transactionId: `WTH_${Date.now()}`
      },
      status: 'completed',
      description: `Withdrew $${amount.toFixed(2)}`,
      balanceBefore: balanceBefore,
      balanceAfter: wallet.balance
    }], { session });

    await session.commitTransaction();

    res.json({
      message: 'Withdrawal successful',
      transaction: transaction[0],
      newBalance: wallet.balance
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Withdrawal error:', error);
    res.status(500).json({ message: 'Server error during withdrawal' });
  } finally {
    session.endSession();
  }
};

// @desc    Get wallet transactions
// @route   GET /api/wallet/transactions
// @access  Private
const getWalletTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find({
      user: req.user._id,
      transactionType: { $in: ['wallet_deposit', 'wallet_withdrawal', 'rent_payout'] }
    })
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Transaction.countDocuments({
      user: req.user._id,
      transactionType: { $in: ['wallet_deposit', 'wallet_withdrawal', 'rent_payout'] }
    });

    res.json({
      transactions,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getWallet,
  depositFunds,
  withdrawFunds,
  getWalletTransactions
};
