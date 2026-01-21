const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getInvestments,
  getInvestmentById,
  getDashboardSummary
} = require('../controllers/investmentController');

// Routes
router.get('/', protect, getInvestments);
router.get('/dashboard/summary', protect, getDashboardSummary);
router.get('/:propertyId', protect, getInvestmentById);

module.exports = router;
