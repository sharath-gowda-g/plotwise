const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Property title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Property description is required']
  },
  propertyType: {
    type: String,
    enum: ['residential', 'commercial', 'industrial', 'land'],
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'USA'
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  totalValue: {
    type: Number,
    required: [true, 'Total property value is required'],
    min: 0
  },
  totalTokens: {
    type: Number,
    required: [true, 'Total tokens must be specified'],
    min: 1
  },
  tokenPrice: {
    type: Number,
    required: true
  },
  tokensAvailable: {
    type: Number,
    required: true
  },
  tokensSold: {
    type: Number,
    default: 0
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  monthlyRent: {
    type: Number,
    required: [true, 'Monthly rent is required'],
    min: 0
  },
  rentalYield: {
    type: Number,
    default: 0
  },
  amenities: [{
    type: String
  }],
  specifications: {
    bedrooms: Number,
    bathrooms: Number,
    area: Number,
    areaUnit: {
      type: String,
      enum: ['sqft', 'sqm'],
      default: 'sqft'
    },
    yearBuilt: Number,
    parking: Number
  },
  documents: [{
    name: String,
    url: String,
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'sold_out', 'delisted'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  isFeatured: {
    type: Boolean,
    default: false
  },
  investorCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate token price and rental yield before saving
propertySchema.pre('save', function(next) {
  if (this.totalValue && this.totalTokens) {
    this.tokenPrice = this.totalValue / this.totalTokens;
  }
  if (this.monthlyRent && this.totalValue) {
    this.rentalYield = ((this.monthlyRent * 12) / this.totalValue) * 100;
  }
  next();
});

// Index for search
propertySchema.index({ title: 'text', description: 'text', 'location.city': 'text' });

module.exports = mongoose.model('Property', propertySchema);
