import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiMapPin, FiUser, FiCalendar, FiHome, FiTrendingUp, FiDollarSign, FiUsers, FiMail, FiPhone, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './PropertyDetail.css';

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buyTokens, setBuyTokens] = useState(1);
  const [buying, setBuying] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    fetchProperty();
    if (isAuthenticated) {
      fetchWallet();
    }
  }, [id, isAuthenticated]);

  const fetchProperty = async () => {
    try {
      const res = await api.get(`/properties/${id}`);
      setProperty(res.data);
    } catch (error) {
      toast.error('Property not found');
      navigate('/properties');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet');
      setWallet(res.data);
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
    }
  };

  const handleBuyTokens = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to invest');
      navigate('/login');
      return;
    }

    if (user.role === 'seller' && property.seller._id === user._id) {
      toast.error('You cannot buy tokens from your own property');
      return;
    }

    setBuying(true);
    try {
      await api.post('/transactions/buy-tokens', {
        propertyId: id,
        tokens: buyTokens
      });
      toast.success(`Successfully purchased ${buyTokens} token(s)!`);
      fetchProperty();
      fetchWallet();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to purchase tokens');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!property) return null;

  const totalCost = buyTokens * property.tokenPrice;
  const monthlyRentPerToken = property.monthlyRent / property.totalTokens;
  const estimatedMonthlyRent = monthlyRentPerToken * buyTokens;
  const soldPercentage = ((property.totalTokens - property.tokensAvailable) / property.totalTokens) * 100;

  return (
    <div className="property-detail-page">
      <div className="container">
        {/* Image Gallery */}
        <div className="property-gallery">
          <div className="main-image">
            <img 
              src={property.images?.[activeImage]?.url || 'https://via.placeholder.com/800x500?text=Property'} 
              alt={property.title} 
            />
          </div>
          {property.images?.length > 1 && (
            <div className="thumbnail-list">
              {property.images.map((img, index) => (
                <button
                  key={index}
                  className={`thumbnail ${index === activeImage ? 'active' : ''}`}
                  onClick={() => setActiveImage(index)}
                >
                  <img src={img.url} alt={`${property.title} ${index + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="property-content">
          {/* Property Info */}
          <div className="property-info">
            <div className="property-header">
              <span className={`property-type badge badge-${property.propertyType}`}>
                {property.propertyType}
              </span>
              <h1>{property.title}</h1>
              <p className="property-location">
                <FiMapPin /> {property.location.address}, {property.location.city}, {property.location.state} {property.location.zipCode}
              </p>
            </div>

            <div className="property-stats-grid">
              <div className="stat-card">
                <FiDollarSign className="stat-icon" />
                <div>
                  <span className="stat-label">Total Value</span>
                  <span className="stat-value">${property.totalValue?.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-card">
                <FiHome className="stat-icon" />
                <div>
                  <span className="stat-label">Token Price</span>
                  <span className="stat-value">${property.tokenPrice?.toLocaleString()}</span>
                </div>
              </div>
              <div className="stat-card">
                <FiTrendingUp className="stat-icon" />
                <div>
                  <span className="stat-label">Rental Yield</span>
                  <span className="stat-value yield">{property.rentalYield?.toFixed(2)}%</span>
                </div>
              </div>
              <div className="stat-card">
                <FiUsers className="stat-icon" />
                <div>
                  <span className="stat-label">Investors</span>
                  <span className="stat-value">{property.investorCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="section">
              <h2>Description</h2>
              <p>{property.description}</p>
            </div>

            {property.specifications && (
              <div className="section">
                <h2>Specifications</h2>
                <div className="specs-grid">
                  {property.specifications.bedrooms && (
                    <div className="spec-item">
                      <span className="spec-label">Bedrooms</span>
                      <span className="spec-value">{property.specifications.bedrooms}</span>
                    </div>
                  )}
                  {property.specifications.bathrooms && (
                    <div className="spec-item">
                      <span className="spec-label">Bathrooms</span>
                      <span className="spec-value">{property.specifications.bathrooms}</span>
                    </div>
                  )}
                  {property.specifications.area && (
                    <div className="spec-item">
                      <span className="spec-label">Area</span>
                      <span className="spec-value">
                        {property.specifications.area?.toLocaleString()} {property.specifications.areaUnit}
                      </span>
                    </div>
                  )}
                  {property.specifications.yearBuilt && (
                    <div className="spec-item">
                      <span className="spec-label">Year Built</span>
                      <span className="spec-value">{property.specifications.yearBuilt}</span>
                    </div>
                  )}
                  {property.specifications.parking && (
                    <div className="spec-item">
                      <span className="spec-label">Parking</span>
                      <span className="spec-value">{property.specifications.parking} spots</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {property.amenities?.length > 0 && (
              <div className="section">
                <h2>Amenities</h2>
                <div className="amenities-list">
                  {property.amenities.map((amenity, index) => (
                    <span key={index} className="amenity-tag">
                      <FiCheck /> {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Seller Info */}
            <div className="section seller-section">
              <h2>Seller Information</h2>
              <div className="seller-card">
                <div className="seller-avatar">
                  <FiUser />
                </div>
                <div className="seller-info">
                  <h3>{property.seller?.firstName} {property.seller?.lastName}</h3>
                  {property.seller?.email && (
                    <p><FiMail /> {property.seller.email}</p>
                  )}
                  {property.seller?.phone && (
                    <p><FiPhone /> {property.seller.phone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Investment Panel */}
          <div className="investment-panel">
            <div className="panel-card">
              <h2>Invest in This Property</h2>
              
              <div className="token-progress">
                <div className="progress-header">
                  <span>{property.tokensAvailable} tokens available</span>
                  <span>{soldPercentage.toFixed(0)}% sold</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${soldPercentage}%` }}
                  ></div>
                </div>
                <p className="total-tokens">Total: {property.totalTokens} tokens</p>
              </div>

              <div className="investment-details">
                <div className="detail-row">
                  <span>Token Price</span>
                  <span className="value">${property.tokenPrice?.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span>Monthly Rent (Total)</span>
                  <span className="value">${property.monthlyRent?.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span>Rent per Token/Month</span>
                  <span className="value">${monthlyRentPerToken.toFixed(2)}</span>
                </div>
              </div>

              {property.tokensAvailable > 0 && property.status === 'approved' ? (
                <>
                  <div className="token-selector">
                    <label>Number of Tokens</label>
                    <div className="selector-input">
                      <button 
                        onClick={() => setBuyTokens(Math.max(1, buyTokens - 1))}
                        disabled={buyTokens <= 1}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={buyTokens}
                        onChange={(e) => setBuyTokens(Math.min(
                          Math.max(1, parseInt(e.target.value) || 1),
                          property.tokensAvailable
                        ))}
                        min="1"
                        max={property.tokensAvailable}
                      />
                      <button 
                        onClick={() => setBuyTokens(Math.min(property.tokensAvailable, buyTokens + 1))}
                        disabled={buyTokens >= property.tokensAvailable}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="investment-summary">
                    <div className="summary-row">
                      <span>Total Cost</span>
                      <span className="total">${totalCost.toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>Est. Monthly Rent</span>
                      <span className="rent">${estimatedMonthlyRent.toFixed(2)}</span>
                    </div>
                    {wallet && (
                      <div className="summary-row wallet-balance">
                        <span>Your Wallet Balance</span>
                        <span className={wallet.balance >= totalCost ? 'sufficient' : 'insufficient'}>
                          ${wallet.balance?.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <button 
                    className="btn btn-primary btn-lg btn-block"
                    onClick={handleBuyTokens}
                    disabled={buying || (wallet && wallet.balance < totalCost)}
                  >
                    {buying ? 'Processing...' : `Buy ${buyTokens} Token(s)`}
                  </button>

                  {wallet && wallet.balance < totalCost && (
                    <p className="insufficient-funds">
                      Insufficient funds. <a href="/wallet">Add funds to wallet</a>
                    </p>
                  )}
                </>
              ) : (
                <div className="sold-out-message">
                  <p>This property is currently not available for investment.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
