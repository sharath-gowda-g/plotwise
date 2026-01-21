const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, adminOnly } = require('../middleware/auth');
const {
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
} = require('../controllers/adminController');

// Apply admin middleware to all routes
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Property management
router.get('/properties', getAllProperties);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', [
  body('reason').optional().isString()
], validate, rejectProperty);
router.put('/properties/:id/feature', toggleFeatured);

// User management
router.get('/users', getAllUsers);
router.put('/users/:id/role', [
  body('role').isIn(['investor', 'seller', 'admin']).withMessage('Invalid role')
], validate, updateUserRole);
router.put('/users/:id/toggle-active', toggleUserActive);

// Rent payout management
router.post('/rent-payout', [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
  body('year').isInt({ min: 2020 }).withMessage('Invalid year'),
  body('totalRent').isFloat({ min: 0 }).withMessage('Total rent must be a positive number')
], validate, processRentPayout);
router.get('/rent-payouts', getRentPayouts);

module.exports = router;
