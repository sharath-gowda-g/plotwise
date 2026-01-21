import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import PropertyCard from '../components/property/PropertyCard';
import api from '../services/api';
import './Properties.css';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    sort: '-createdAt'
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [page, filters]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== '')
        )
      });

      const res = await api.get(`/properties?${params}`);
      setProperties(res.data.properties);
      setTotalPages(res.data.pages);
    } catch (error) {
      console.error('Failed to fetch properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      sort: '-createdAt'
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '' && v !== '-createdAt');

  return (
    <div className="properties-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1>Investment Properties</h1>
          <p>Discover premium real estate investment opportunities</p>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-bar">
            <FiSearch className="search-icon" />
            <input
              type="text"
              name="search"
              placeholder="Search by property name or city..."
              value={filters.search}
              onChange={handleFilterChange}
              className="search-input"
            />
          </div>

          <button 
            className="filter-toggle btn btn-outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
            {hasActiveFilters && <span className="filter-badge">!</span>}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>Property Type</label>
              <select name="type" value={filters.type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="land">Land</option>
              </select>
            </div>

            <div className="filter-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                placeholder="Enter city"
                value={filters.city}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Min Token Price</label>
              <input
                type="number"
                name="minPrice"
                placeholder="$0"
                value={filters.minPrice}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Max Token Price</label>
              <input
                type="number"
                name="maxPrice"
                placeholder="$10,000"
                value={filters.maxPrice}
                onChange={handleFilterChange}
              />
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select name="sort" value={filters.sort} onChange={handleFilterChange}>
                <option value="-createdAt">Newest First</option>
                <option value="createdAt">Oldest First</option>
                <option value="tokenPrice">Price: Low to High</option>
                <option value="-tokenPrice">Price: High to Low</option>
                <option value="-rentalYield">Highest Yield</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button className="clear-filters btn btn-sm" onClick={clearFilters}>
                <FiX /> Clear All
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="properties-grid">
              {properties.map(property => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  className="btn btn-outline btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {page} of {totalPages}
                </span>
                <button 
                  className="btn btn-outline btn-sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-results">
            <h3>No Properties Found</h3>
            <p>Try adjusting your filters or search criteria</p>
            {hasActiveFilters && (
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Properties;
