const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, sellerOnly } = require('../middleware/auth');
const {
  getProperties,
  getFeaturedProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getSellerProperties
} = require('../controllers/propertyController');

// Validation rules
const propertyValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('propertyType').isIn(['residential', 'commercial', 'industrial', 'land']).withMessage('Invalid property type'),
  body('location.address').trim().notEmpty().withMessage('Address is required'),
  body('location.city').trim().notEmpty().withMessage('City is required'),
  body('location.state').trim().notEmpty().withMessage('State is required'),
  body('location.zipCode').trim().notEmpty().withMessage('Zip code is required'),
  body('totalValue').isFloat({ min: 1 }).withMessage('Total value must be greater than 0'),
  body('totalTokens').isInt({ min: 1 }).withMessage('Total tokens must be at least 1'),
  body('monthlyRent').isFloat({ min: 0 }).withMessage('Monthly rent must be 0 or greater')
];

// Public routes
router.get('/', getProperties);
router.get('/featured', getFeaturedProperties);
router.get('/:id', getPropertyById);

// Protected routes (Seller)
router.get('/seller/my-properties', protect, sellerOnly, getSellerProperties);
router.post('/', protect, sellerOnly, propertyValidation, validate, createProperty);
router.put('/:id', protect, sellerOnly, updateProperty);
router.delete('/:id', protect, sellerOnly, deleteProperty);

module.exports = router;
