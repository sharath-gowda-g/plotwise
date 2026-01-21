const { Property, Ownership, Transaction, Wallet } = require('../models');
const mongoose = require('mongoose');

// @desc    Buy property tokens
// @route   POST /api/transactions/buy-tokens
// @access  Private/Investor
const buyTokens = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { propertyId, tokens } = req.body;

    if (!tokens || tokens < 1) {
      return res.status(400).json({ message: 'Invalid token amount' });
    }

    // Get property
    const property = await Property.findById(propertyId).session(session);
    if (!property) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.status !== 'approved') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Property is not available for investment' });
    }

    if (tokens > property.tokensAvailable) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Not enough tokens available' });
    }

    // Prevent seller from buying their own tokens
    if (property.seller.toString() === req.user._id.toString()) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot buy tokens from your own property' });
    }

    const totalCost = tokens * property.tokenPrice;

    // Get buyer's wallet
    const wallet = await Wallet.findOne({ user: req.user._id }).session(session);
    if (!wallet) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (wallet.balance < totalCost) {
      await session.abortTransaction();
      return res.status(400).json({ 
        message: 'Insufficient wallet balance',
        required: totalCost,
        available: wallet.balance
      });
    }

    // Deduct from buyer's wallet
    const balanceBefore = wallet.balance;
    wallet.balance -= totalCost;
    wallet.totalInvested += totalCost;
    wallet.lastTransaction = new Date();
    await wallet.save({ session });

    // Credit to seller's wallet
    let sellerWallet = await Wallet.findOne({ user: property.seller }).session(session);
    if (!sellerWallet) {
      sellerWallet = await Wallet.create([{ user: property.seller }], { session });
      sellerWallet = sellerWallet[0];
    }
    sellerWallet.balance += totalCost;
    sellerWallet.lastTransaction = new Date();
    await sellerWallet.save({ session });

    // Update property tokens
    property.tokensAvailable -= tokens;
    property.tokensSold += tokens;
    if (property.tokensAvailable === 0) {
      property.status = 'sold_out';
    }
    await property.save({ session });

    // Create or update ownership
    let ownership = await Ownership.findOne({
      user: req.user._id,
      property: propertyId
    }).session(session);

    if (ownership) {
      ownership.tokensOwned += tokens;
      ownership.totalInvested += totalCost;
      ownership.ownershipPercentage = (ownership.tokensOwned / property.totalTokens) * 100;
      await ownership.save({ session });
    } else {
      ownership = await Ownership.create([{
        user: req.user._id,
        property: propertyId,
        tokensOwned: tokens,
        purchasePrice: property.tokenPrice,
        totalInvested: totalCost,
        ownershipPercentage: (tokens / property.totalTokens) * 100
      }], { session });
      ownership = ownership[0];

      // Update investor count
      property.investorCount += 1;
      await property.save({ session });
    }

    // Create transaction record
    const transaction = await Transaction.create([{
      user: req.user._id,
      property: propertyId,
      transactionType: 'token_purchase',
      tokens: tokens,
      amount: totalCost,
      pricePerToken: property.tokenPrice,
      paymentMethod: 'wallet',
      status: 'completed',
      description: `Purchased ${tokens} tokens of ${property.title}`,
      balanceBefore: balanceBefore,
      balanceAfter: wallet.balance
    }], { session });

    await session.commitTransaction();

    res.status(201).json({
      message: 'Tokens purchased successfully',
      transaction: transaction[0],
      ownership: {
        tokensOwned: ownership.tokensOwned,
        ownershipPercentage: ownership.ownershipPercentage
      },
      walletBalance: wallet.balance
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Buy tokens error:', error);
    res.status(500).json({ message: 'Server error during transaction' });
  } finally {
    session.endSession();
  }
};

// @desc    Get user's transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const query = { user: req.user._id };
    if (type) query.transactionType = type;

    const transactions = await Transaction.find(query)
      .populate('property', 'title images')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('property', 'title images location');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  buyTokens,
  getTransactions,
  getTransactionById
};
