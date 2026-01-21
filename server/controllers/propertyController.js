const { Property, Ownership, User } = require('../models');

// @desc    Get all approved properties
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      type,
      city,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      search
    } = req.query;

    const query = { status: 'approved' };

    if (type) query.propertyType = type;
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (minPrice || maxPrice) {
      query.tokenPrice = {};
      if (minPrice) query.tokenPrice.$gte = Number(minPrice);
      if (maxPrice) query.tokenPrice.$lte = Number(maxPrice);
    }
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'location.city': new RegExp(search, 'i') }
      ];
    }

    const properties = await Property.find(query)
      .populate('seller', 'firstName lastName')
      .sort(sort)
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
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get featured properties
// @route   GET /api/properties/featured
// @access  Public
const getFeaturedProperties = async (req, res) => {
  try {
    const properties = await Property.find({ status: 'approved', isFeatured: true })
      .populate('seller', 'firstName lastName')
      .limit(6);

    res.json(properties);
  } catch (error) {
    console.error('Get featured properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id)
      .populate('seller', 'firstName lastName email phone');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Get investor count
    const investorCount = await Ownership.countDocuments({ property: property._id });
    property.investorCount = investorCount;

    res.json(property);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create property (Seller)
// @route   POST /api/properties
// @access  Private/Seller
const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      propertyType,
      location,
      totalValue,
      totalTokens,
      monthlyRent,
      amenities,
      specifications,
      images
    } = req.body;

    const property = await Property.create({
      title,
      description,
      propertyType,
      location,
      totalValue,
      totalTokens,
      tokensAvailable: totalTokens,
      monthlyRent,
      amenities,
      specifications,
      images,
      seller: req.user._id,
      status: 'pending'
    });

    res.status(201).json(property);
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update property (Seller)
// @route   PUT /api/properties/:id
// @access  Private/Seller
const updateProperty = async (req, res) => {
  try {
    let property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check ownership
    if (property.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    // Can only update pending properties
    if (property.status !== 'pending' && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'Cannot update approved or rejected properties' });
    }

    const allowedUpdates = [
      'title', 'description', 'propertyType', 'location',
      'totalValue', 'totalTokens', 'monthlyRent', 'amenities',
      'specifications', 'images'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        property[field] = req.body[field];
      }
    });

    if (req.body.totalTokens && property.tokensSold === 0) {
      property.tokensAvailable = req.body.totalTokens;
    }

    await property.save();

    res.json(property);
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete property (Seller)
// @route   DELETE /api/properties/:id
// @access  Private/Seller
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Check ownership
    if (property.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    // Can only delete if no tokens sold
    if (property.tokensSold > 0) {
      return res.status(400).json({ message: 'Cannot delete property with sold tokens' });
    }

    await property.deleteOne();

    res.json({ message: 'Property removed' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get seller's properties
// @route   GET /api/properties/seller/my-properties
// @access  Private/Seller
const getSellerProperties = async (req, res) => {
  try {
    const properties = await Property.find({ seller: req.user._id })
      .sort('-createdAt');

    res.json(properties);
  } catch (error) {
    console.error('Get seller properties error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getProperties,
  getFeaturedProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getSellerProperties
};
