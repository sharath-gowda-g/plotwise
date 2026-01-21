import React from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin, FiTrendingUp } from 'react-icons/fi';
import './PropertyCard.css';

const PropertyCard = ({ property }) => {
  const {
    _id,
    title,
    images,
    location,
    tokenPrice,
    tokensAvailable,
    totalTokens,
    rentalYield,
    propertyType,
    status
  } = property;

  const primaryImage = images?.find(img => img.isPrimary)?.url || images?.[0]?.url || 'https://via.placeholder.com/400x300?text=Property';
  const soldPercentage = ((totalTokens - tokensAvailable) / totalTokens) * 100;

  return (
    <Link to={`/properties/${_id}`} className="property-card">
      <div className="property-image">
        <img src={primaryImage} alt={title} />
        <span className={`property-type badge badge-${propertyType}`}>
          {propertyType}
        </span>
        {status === 'sold_out' && (
          <div className="sold-out-overlay">
            <span>Sold Out</span>
          </div>
        )}
      </div>
      <div className="property-content">
        <h3 className="property-title">{title}</h3>
        <p className="property-location">
          <FiMapPin /> {location?.city}, {location?.state}
        </p>
        
        <div className="property-stats">
          <div className="stat">
            <span className="stat-label">Token Price</span>
            <span className="stat-value">${tokenPrice?.toLocaleString()}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Rental Yield</span>
            <span className="stat-value yield">
              <FiTrendingUp /> {rentalYield?.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="property-progress">
          <div className="progress-info">
            <span>{tokensAvailable} of {totalTokens} tokens available</span>
            <span>{soldPercentage.toFixed(0)}% sold</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${soldPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;
