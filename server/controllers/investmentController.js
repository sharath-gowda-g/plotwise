const { Ownership, Property } = require('../models');

// @desc    Get user's investments/portfolio
// @route   GET /api/investments
// @access  Private
const getInvestments = async (req, res) => {
  try {
    const investments = await Ownership.find({
      user: req.user._id,
      isActive: true
    }).populate('property', 'title images location tokenPrice monthlyRent totalTokens status');

    // Calculate totals
    let totalValue = 0;
    let totalRentEarned = 0;
    let totalTokens = 0;

    const enrichedInvestments = investments.map(inv => {
      const currentValue = inv.tokensOwned * inv.property.tokenPrice;
      const monthlyRentShare = (inv.tokensOwned / inv.property.totalTokens) * inv.property.monthlyRent;
      
      totalValue += currentValue;
      totalRentEarned += inv.rentEarned;
      totalTokens += inv.tokensOwned;

      return {
        ...inv.toObject(),
        currentValue,
        monthlyRentShare,
        profitLoss: currentValue - inv.totalInvested
      };
    });

    res.json({
      investments: enrichedInvestments,
      summary: {
        totalValue,
        totalRentEarned,
        totalTokens,
        totalProperties: investments.length
      }
    });
  } catch (error) {
    console.error('Get investments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single investment details
// @route   GET /api/investments/:propertyId
// @access  Private
const getInvestmentById = async (req, res) => {
  try {
    const investment = await Ownership.findOne({
      user: req.user._id,
      property: req.params.propertyId
    }).populate('property');

    if (!investment) {
      return res.status(404).json({ message: 'Investment not found' });
    }

    const currentValue = investment.tokensOwned * investment.property.tokenPrice;
    const monthlyRentShare = (investment.tokensOwned / investment.property.totalTokens) * investment.property.monthlyRent;

    res.json({
      ...investment.toObject(),
      currentValue,
      monthlyRentShare,
      profitLoss: currentValue - investment.totalInvested
    });
  } catch (error) {
    console.error('Get investment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get dashboard summary for investor
// @route   GET /api/investments/dashboard/summary
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const investments = await Ownership.find({
      user: req.user._id,
      isActive: true
    }).populate('property', 'title tokenPrice monthlyRent totalTokens images');

    let portfolioValue = 0;
    let totalInvested = 0;
    let monthlyIncome = 0;
    let totalRentEarned = 0;

    investments.forEach(inv => {
      portfolioValue += inv.tokensOwned * inv.property.tokenPrice;
      totalInvested += inv.totalInvested;
      monthlyIncome += (inv.tokensOwned / inv.property.totalTokens) * inv.property.monthlyRent;
      totalRentEarned += inv.rentEarned;
    });

    // Get recent investments
    const recentInvestments = investments.slice(0, 5).map(inv => ({
      propertyId: inv.property._id,
      title: inv.property.title,
      image: inv.property.images?.[0]?.url,
      tokensOwned: inv.tokensOwned,
      value: inv.tokensOwned * inv.property.tokenPrice
    }));

    res.json({
      portfolioValue,
      totalInvested,
      monthlyIncome,
      totalRentEarned,
      totalProperties: investments.length,
      totalReturn: portfolioValue - totalInvested,
      returnPercentage: totalInvested > 0 ? ((portfolioValue - totalInvested) / totalInvested) * 100 : 0,
      recentInvestments
    });
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getInvestments,
  getInvestmentById,
  getDashboardSummary
};
