import React, { useState, useEffect } from 'react';
import { FiPlus, FiHome, FiDollarSign, FiUsers, FiEdit2, FiTrash2, FiEye, FiClock, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Dashboard.css';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'residential',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'USA'
    },
    totalValue: '',
    totalTokens: '',
    monthlyRent: '',
    specifications: {
      bedrooms: '',
      bathrooms: '',
      area: '',
      areaUnit: 'sqft',
      yearBuilt: '',
      parking: ''
    },
    amenities: '',
    images: [{ url: '', isPrimary: true }]
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const res = await api.get('/properties/seller/my-properties');
      setProperties(res.data);
    } catch (error) {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = { ...newImages[index], url: value };
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, { url: '', isPrimary: false }]
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      propertyType: 'residential',
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      totalValue: '',
      totalTokens: '',
      monthlyRent: '',
      specifications: {
        bedrooms: '',
        bathrooms: '',
        area: '',
        areaUnit: 'sqft',
        yearBuilt: '',
        parking: ''
      },
      amenities: '',
      images: [{ url: '', isPrimary: true }]
    });
    setEditingProperty(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        totalValue: Number(formData.totalValue),
        totalTokens: Number(formData.totalTokens),
        monthlyRent: Number(formData.monthlyRent),
        specifications: {
          ...formData.specifications,
          bedrooms: formData.specifications.bedrooms ? Number(formData.specifications.bedrooms) : undefined,
          bathrooms: formData.specifications.bathrooms ? Number(formData.specifications.bathrooms) : undefined,
          area: formData.specifications.area ? Number(formData.specifications.area) : undefined,
          yearBuilt: formData.specifications.yearBuilt ? Number(formData.specifications.yearBuilt) : undefined,
          parking: formData.specifications.parking ? Number(formData.specifications.parking) : undefined
        },
        amenities: formData.amenities.split(',').map(a => a.trim()).filter(a => a),
        images: formData.images.filter(img => img.url)
      };

      if (editingProperty) {
        await api.put(`/properties/${editingProperty._id}`, payload);
        toast.success('Property updated successfully');
      } else {
        await api.post('/properties', payload);
        toast.success('Property listed successfully! Awaiting approval.');
      }

      setShowModal(false);
      resetForm();
      fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save property');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (property) => {
    setEditingProperty(property);
    setFormData({
      title: property.title,
      description: property.description,
      propertyType: property.propertyType,
      location: property.location,
      totalValue: property.totalValue,
      totalTokens: property.totalTokens,
      monthlyRent: property.monthlyRent,
      specifications: property.specifications || {},
      amenities: property.amenities?.join(', ') || '',
      images: property.images?.length ? property.images : [{ url: '', isPrimary: true }]
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property?')) return;

    try {
      await api.delete(`/properties/${id}`);
      toast.success('Property deleted');
      fetchProperties();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete property');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger',
      sold_out: 'badge-primary'
    };
    return badges[status] || 'badge-secondary';
  };

  const stats = {
    total: properties.length,
    approved: properties.filter(p => p.status === 'approved').length,
    pending: properties.filter(p => p.status === 'pending').length,
    totalValue: properties.reduce((sum, p) => sum + (p.totalValue || 0), 0),
    tokensSold: properties.reduce((sum, p) => sum + (p.tokensSold || 0), 0)
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page seller-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Seller Dashboard</h1>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <FiPlus /> List New Property
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon properties"><FiHome /></div>
            <div className="stat-content">
              <span className="stat-label">Total Properties</span>
              <span className="stat-value">{stats.total}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon portfolio"><FiCheck /></div>
            <div className="stat-content">
              <span className="stat-label">Approved</span>
              <span className="stat-value">{stats.approved}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon income"><FiClock /></div>
            <div className="stat-content">
              <span className="stat-label">Pending</span>
              <span className="stat-value">{stats.pending}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon invested"><FiDollarSign /></div>
            <div className="stat-content">
              <span className="stat-label">Total Value</span>
              <span className="stat-value">${stats.totalValue.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div className="dashboard-section full-width">
          <div className="section-header">
            <h2>My Properties</h2>
          </div>

          {properties.length > 0 ? (
            <div className="properties-table">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Tokens</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {properties.map(property => (
                    <tr key={property._id}>
                      <td>
                        <div className="property-cell">
                          <img 
                            src={property.images?.[0]?.url || 'https://via.placeholder.com/60'} 
                            alt={property.title} 
                          />
                          <div>
                            <strong>{property.title}</strong>
                            <span>{property.location?.city}, {property.location?.state}</span>
                          </div>
                        </div>
                      </td>
                      <td className="capitalize">{property.propertyType}</td>
                      <td>${property.totalValue?.toLocaleString()}</td>
                      <td>
                        {property.tokensSold}/{property.totalTokens}
                        <div className="token-bar">
                          <div style={{ width: `${(property.tokensSold / property.totalTokens) * 100}%` }}></div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(property.status)}`}>
                          {property.status}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <a href={`/properties/${property._id}`} className="action-btn view" title="View">
                            <FiEye />
                          </a>
                          {property.status === 'pending' && (
                            <>
                              <button className="action-btn edit" onClick={() => handleEdit(property)} title="Edit">
                                <FiEdit2 />
                              </button>
                              <button className="action-btn delete" onClick={() => handleDelete(property._id)} title="Delete">
                                <FiTrash2 />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <FiHome className="empty-icon" />
              <h3>No Properties Listed</h3>
              <p>Start selling by listing your first property</p>
              <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                <FiPlus /> List Property
              </button>
            </div>
          )}
        </div>

        {/* Add/Edit Property Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingProperty ? 'Edit Property' : 'List New Property'}</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Title *</label>
                    <input
                      type="text"
                      name="title"
                      className="form-input"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Property Type *</label>
                    <select name="propertyType" className="form-select" value={formData.propertyType} onChange={handleChange}>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="land">Land</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea
                    name="description"
                    className="form-input"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>

                <h3 className="form-section-title">Location</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Address *</label>
                    <input type="text" name="location.address" className="form-input" value={formData.location.address} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input type="text" name="location.city" className="form-input" value={formData.location.city} onChange={handleChange} required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <input type="text" name="location.state" className="form-input" value={formData.location.state} onChange={handleChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code *</label>
                    <input type="text" name="location.zipCode" className="form-input" value={formData.location.zipCode} onChange={handleChange} required />
                  </div>
                </div>

                <h3 className="form-section-title">Investment Details</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Value ($) *</label>
                    <input type="number" name="totalValue" className="form-input" value={formData.totalValue} onChange={handleChange} min="1" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Total Tokens *</label>
                    <input type="number" name="totalTokens" className="form-input" value={formData.totalTokens} onChange={handleChange} min="1" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monthly Rent ($) *</label>
                    <input type="number" name="monthlyRent" className="form-input" value={formData.monthlyRent} onChange={handleChange} min="0" required />
                  </div>
                </div>

                <h3 className="form-section-title">Specifications (Optional)</h3>
                <div className="form-row four-cols">
                  <div className="form-group">
                    <label className="form-label">Bedrooms</label>
                    <input type="number" name="specifications.bedrooms" className="form-input" value={formData.specifications.bedrooms} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Bathrooms</label>
                    <input type="number" name="specifications.bathrooms" className="form-input" value={formData.specifications.bathrooms} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Area (sqft)</label>
                    <input type="number" name="specifications.area" className="form-input" value={formData.specifications.area} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year Built</label>
                    <input type="number" name="specifications.yearBuilt" className="form-input" value={formData.specifications.yearBuilt} onChange={handleChange} />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Amenities (comma separated)</label>
                  <input type="text" name="amenities" className="form-input" value={formData.amenities} onChange={handleChange} placeholder="Pool, Gym, Parking, etc." />
                </div>

                <div className="form-group">
                  <label className="form-label">Image URLs</label>
                  {formData.images.map((img, index) => (
                    <input
                      key={index}
                      type="url"
                      className="form-input"
                      value={img.url}
                      onChange={(e) => handleImageChange(index, e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      style={{ marginBottom: '0.5rem' }}
                    />
                  ))}
                  <button type="button" className="btn btn-sm btn-outline" onClick={addImageField}>
                    + Add Image
                  </button>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : (editingProperty ? 'Update Property' : 'List Property')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
