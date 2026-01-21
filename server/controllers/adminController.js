const { Property, User, Ownership, Transaction, RentPayout, Wallet } = require('../models');
const mongoose = require('mongoose');

// @desc    Get all properties (Admin)
// @route   GET /api/admin/properties
// @access  Private/Admin
const getAllProperties = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const properties = await Property.find(query)
      .populate('seller', 'firstName lastName email')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Property.countDocuments(query);

    res.json({
      properties,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    console.error('Admin get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve property
// @route   PUT /api/admin/properties/:id/approve
// @access  Private/Admin
const approveProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.status !== 'pending') {
      return res.status(400).json({ message: 'Property is not pending approval' });
    }

    property.status = 'approved';
    property.approvedBy = req.user._id;
    property.approvedAt = new Date();
    await property.save();

    res.json({ message: 'Property approved successfully', property });
  } catch (error) {
    console.error('Approve property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reject property
// @route   PUT /api/admin/properties/:id/reject
// @access  Private/Admin
const rejectProperty = async (req, res) => {
  try {
    const { reason } = req.body;

    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.status = 'rejected';
    property.rejectionReason = reason;
    await property.save();

    res.json({ message: 'Property rejected', property });
  } catch (error) {
    console.error('Reject property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle featured property
// @route   PUT /api/admin/properties/:id/feature
// @access  Private/Admin
const toggleFeatured = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    property.isFeatured = !property.isFeatured;
    await property.save();

    res.json({
      message: property.isFeatured ? 'Property featured' : 'Property unfeatured',
      isFeatured: property.isFeatured
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const query = {};
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await User.countDocuments(query);

    res.json({
      users,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!['investor', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.role = role;
    await user.save();

    res.json({ message: 'User role updated', user: { _id: user._id, role: user.role } });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private/Admin
const toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating self
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot deactivate your own account' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: user.isActive ? 'User activated' : 'User deactivated',
      isActive: user.isActive
    });
  } catch (error) {
    console.error('Toggle user active error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Process rent payout for a property
// @route   POST /api/admin/rent-payout
// @access  Private/Admin
const processRentPayout = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { propertyId, month, year, totalRent } = req.body;

    // Validate inputs
    if (!propertyId || !month || !year || !totalRent) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const property = await Property.findById(propertyId).session(session);
    if (!property) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check if payout already exists
    const existingPayout = await RentPayout.findOne({
      property: propertyId,
      payoutMonth: month,
      payoutYear: year
    }).session(session);

    if (existingPayout) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Rent payout already processed for this month' });
    }

    // Get all owners
    const owners = await Ownership.find({
      property: propertyId,
      isActive: true
    }).session(session);

    if (owners.length === 0) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'No investors found for this property' });
    }

    const rentPerToken = totalRent / property.totalTokens;
    const distributions = [];
    let totalDistributed = 0;

    // Process each owner
    for (const owner of owners) {
      const rentAmount = owner.tokensOwned * rentPerToken;
      
      // Update owner's wallet
      let wallet = await Wallet.findOne({ user: owner.user }).session(session);
      if (!wallet) {
        wallet = await Wallet.create([{ user: owner.user }], { session });
        wallet = wallet[0];
      }

      const balanceBefore = wallet.balance;
      wallet.balance += rentAmount;
      wallet.totalRentEarned += rentAmount;
      wallet.lastTransaction = new Date();
      await wallet.save({ session });

      // Update ownership rent earned
      owner.rentEarned += rentAmount;
      owner.lastRentPayout = new Date();
      await owner.save({ session });

      // Create transaction for each user
      await Transaction.create([{
        user: owner.user,
        property: propertyId,
        transactionType: 'rent_payout',
        amount: rentAmount,
        paymentMethod: 'system',
        status: 'completed',
        description: `Rent payout for ${month}/${year} - ${property.title}`,
        balanceBefore: balanceBefore,
        balanceAfter: wallet.balance,
        metadata: { month, year, tokensHeld: owner.tokensOwned }
      }], { session });

      distributions.push({
        user: owner.user,
        tokensHeld: owner.tokensOwned,
        amountPaid: rentAmount
      });

      totalDistributed += rentAmount;
    }

    // Create rent payout record
    const rentPayout = await RentPayout.create([{
      property: propertyId,
      totalRentCollected: totalRent,
      payoutMonth: month,
      payoutYear: year,
      rentPerToken: rentPerToken,
      distributions: distributions,
      totalDistributed: totalDistributed,
      status: 'completed',
      processedBy: req.user._id,
      processedAt: new Date()
    }], { session });

    await session.commitTransaction();

    res.json({
      message: 'Rent payout processed successfully',
      payout: rentPayout[0],
      investorsPaid: distributions.length,
      totalDistributed
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Process rent payout error:', error);
    res.status(500).json({ message: 'Server error during rent payout' });
  } finally {
    session.endSession();
  }
};

// @desc    Get rent payout history
// @route   GET /api/admin/rent-payouts
// @access  Private/Admin
const getRentPayouts = async (req, res) => {
  try {
    const { propertyId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (propertyId) query.property = propertyId;

    const payouts = await RentPayout.find(query)
      .populate('property', 'title')
      .populate('processedBy', 'firstName lastName')
      .sort('-createdAt')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await RentPayout.countDocuments(query);

    res.json({
      payouts,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    console.error('Get rent payouts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalInvestors,
      totalSellers,
      totalProperties,
      pendingProperties,
      approvedProperties,
      totalTransactions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'investor' }),
      User.countDocuments({ role: 'seller' }),
      Property.countDocuments(),
      Property.countDocuments({ status: 'pending' }),
      Property.countDocuments({ status: 'approved' }),
      Transaction.countDocuments()
    ]);

    // Calculate total invested
    const investmentStats = await Transaction.aggregate([
      { $match: { transactionType: 'token_purchase', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    // Recent transactions
    const recentTransactions = await Transaction.find()
      .populate('user', 'firstName lastName')
      .populate('property', 'title')
      .sort('-createdAt')
      .limit(10);

    res.json({
      users: {
        total: totalUsers,
        investors: totalInvestors,
        sellers: totalSellers
      },
      properties: {
        total: totalProperties,
        pending: pendingProperties,
        approved: approvedProperties
      },
      transactions: {
        total: totalTransactions,
        totalInvested: investmentStats[0]?.total || 0
      },
      recentTransactions
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProperties,
  approveProperty,
  rejectProperty,
  toggleFeatured,
  getAllUsers,
  updateUserRole,
  toggleUserActive,
  processRentPayout,
  getRentPayouts,
  getDashboardStats
};
