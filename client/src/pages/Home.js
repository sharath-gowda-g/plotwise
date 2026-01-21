import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTrendingUp, FiShield, FiDollarSign, FiPieChart, FiUsers, FiHome } from 'react-icons/fi';
import PropertyCard from '../components/property/PropertyCard';
import api from '../services/api';
import './Home.css';

const Home = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/properties/featured');
        setFeaturedProperties(res.data);
      } catch (error) {
        console.error('Failed to fetch featured properties:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  const features = [
    {
      icon: <FiDollarSign />,
      title: 'Low Minimum Investment',
      description: 'Start investing in premium real estate with as little as $100. No need for massive capital.'
    },
    {
      icon: <FiPieChart />,
      title: 'Fractional Ownership',
      description: 'Own a piece of high-value properties through tokenization. Diversify your portfolio easily.'
    },
    {
      icon: <FiTrendingUp />,
      title: 'Passive Rental Income',
      description: 'Earn monthly rental income proportional to your ownership. Rent distributed automatically.'
    },
    {
      icon: <FiShield />,
      title: 'Secure & Transparent',
      description: 'All transactions are recorded securely. Complete transparency in property management.'
    }
  ];

  const stats = [
    { value: '$50M+', label: 'Total Property Value' },
    { value: '10,000+', label: 'Happy Investors' },
    { value: '150+', label: 'Properties Listed' },
    { value: '8.5%', label: 'Avg. Annual Yield' }
  ];

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up in minutes and complete verification to start investing.'
    },
    {
      number: '02',
      title: 'Fund Your Wallet',
      description: 'Add funds to your wallet using your preferred payment method.'
    },
    {
      number: '03',
      title: 'Choose Properties',
      description: 'Browse vetted properties and select ones that match your goals.'
    },
    {
      number: '04',
      title: 'Earn Returns',
      description: 'Receive monthly rental income directly to your wallet.'
    }
  ];

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Invest in Real Estate, <br />
              <span className="gradient-text">One Token at a Time</span>
            </h1>
            <p className="hero-description">
              PlotWise democratizes real estate investment through fractional ownership. 
              Build wealth, earn passive rental income, and diversify your portfolio 
              with premium properties starting from just $100.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary btn-lg">
                Start Investing <FiArrowRight />
              </Link>
              <Link to="/properties" className="btn btn-outline btn-lg">
                Browse Properties
              </Link>
            </div>
            <div className="hero-stats">
              {stats.map((stat, index) => (
                <div key={index} className="hero-stat">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-image">
            <div className="hero-card">
              <div className="card-header">
                <FiHome className="card-icon" />
                <span>Featured Investment</span>
              </div>
              <img 
                src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600" 
                alt="Luxury Property" 
              />
              <div className="card-content">
                <h3>Luxury Downtown Condo</h3>
                <div className="card-stats">
                  <div>
                    <span className="label">Token Price</span>
                    <span className="value">$250</span>
                  </div>
                  <div>
                    <span className="label">Annual Yield</span>
                    <span className="value yield">9.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Why Choose PlotWise?</h2>
            <p>We're making real estate investment accessible, transparent, and rewarding for everyone.</p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Start your real estate investment journey in four simple steps.</p>
          </div>
          <div className="steps-grid">
            {steps.map((step, index) => (
              <div key={index} className="step-card">
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="featured-properties">
        <div className="container">
          <div className="section-header">
            <h2>Featured Properties</h2>
            <p>Handpicked investment opportunities with strong rental yields.</p>
          </div>
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : featuredProperties.length > 0 ? (
            <div className="properties-grid">
              {featuredProperties.map(property => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          ) : (
            <p className="no-properties">No featured properties available at the moment.</p>
          )}
          <div className="section-footer">
            <Link to="/properties" className="btn btn-primary">
              View All Properties <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Build Your Real Estate Portfolio?</h2>
            <p>Join thousands of investors earning passive income through fractional real estate ownership.</p>
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Today <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
