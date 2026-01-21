import React, { useState, useEffect } from 'react';
import { FiUsers, FiHome, FiDollarSign, FiCheck, FiX, FiStar, FiClock, FiTrendingUp } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Dashboard.css';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [rentForm, setRentForm] = useState({
    propertyId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    totalRent: ''
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'dashboard') {
        const res = await api.get('/admin/dashboard');
        setStats(res.data);
      } else if (activeTab === 'properties') {
        const res = await api.get('/admin/properties');
        setProperties(res.data.properties);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data.users);
      } else if (activeTab === 'rent') {
        const [propertiesRes, payoutsRes] = await Promise.all([
          api.get('/admin/properties?status=approved'),
          api.get('/admin/rent-payouts')
        ]);
        setProperties(propertiesRes.data.properties);
        setPayouts(payoutsRes.data.payouts);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/properties/${id}/approve`);
      toast.success('Property approved');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve property');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Rejection reason (optional):');
    try {
      await api.put(`/admin/properties/${id}/reject`, { reason });
      toast.success('Property rejected');
      fetchData();
    } catch (error) {
      toast.error('Failed to reject property');
    }
  };

  const handleToggleFeatured = async (id) => {
    try {
      await api.put(`/admin/properties/${id}/feature`);
      toast.success('Property featured status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update featured status');
    }
  };

  const handleUpdateRole = async (id, role) => {
    try {
      await api.put(`/admin/users/${id}/role`, { role });
      toast.success('User role updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleToggleUserActive = async (id) => {
    try {
      await api.put(`/admin/users/${id}/toggle-active`);
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleProcessRent = async (e) => {
    e.preventDefault();
    if (!rentForm.propertyId || !rentForm.totalRent) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      await api.post('/admin/rent-payout', {
        propertyId: rentForm.propertyId,
        month: rentForm.month,
        year: rentForm.year,
        totalRent: Number(rentForm.totalRent)
      });
      toast.success('Rent payout processed successfully!');
      setRentForm({ ...rentForm, propertyId: '', totalRent: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process rent payout');
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

  if (loading && !stats) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page admin-dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'properties' ? 'active' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`tab ${activeTab === 'rent' ? 'active' : ''}`}
            onClick={() => setActiveTab('rent')}
          >
            Rent Management
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon portfolio"><FiUsers /></div>
                <div className="stat-content">
                  <span className="stat-label">Total Users</span>
                  <span className="stat-value">{stats.users?.total || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon properties"><FiHome /></div>
                <div className="stat-content">
                  <span className="stat-label">Total Properties</span>
                  <span className="stat-value">{stats.properties?.total || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon income"><FiClock /></div>
                <div className="stat-content">
                  <span className="stat-label">Pending Approval</span>
                  <span className="stat-value">{stats.properties?.pending || 0}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon invested"><FiDollarSign /></div>
                <div className="stat-content">
                  <span className="stat-label">Total Invested</span>
                  <span className="stat-value">${stats.transactions?.totalInvested?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            <div className="admin-grid">
              <div className="dashboard-section">
                <div className="section-header">
                  <h2>User Breakdown</h2>
                </div>
                <div className="breakdown-list">
                  <div className="breakdown-item">
                    <span>Investors</span>
                    <span className="value">{stats.users?.investors || 0}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Sellers</span>
                    <span className="value">{stats.users?.sellers || 0}</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-section">
                <div className="section-header">
                  <h2>Recent Transactions</h2>
                </div>
                <div className="recent-transactions">
                  {stats.recentTransactions?.slice(0, 5).map(tx => (
                    <div key={tx._id} className="tx-item">
                      <div className="tx-details">
                        <span className="tx-user">{tx.user?.firstName} {tx.user?.lastName}</span>
                        <span className="tx-type">{tx.transactionType.replace(/_/g, ' ')}</span>
                      </div>
                      <span className="tx-amount">${tx.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Properties Tab */}
        {activeTab === 'properties' && (
          <div className="dashboard-section full-width">
            <div className="section-header">
              <h2>All Properties</h2>
              <select 
                className="form-select" 
                style={{ width: 'auto' }}
                onChange={(e) => {
                  // Filter functionality
                }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="properties-table">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Seller</th>
                    <th>Value</th>
                    <th>Status</th>
                    <th>Featured</th>
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
                      <td>{property.seller?.firstName} {property.seller?.lastName}</td>
                      <td>${property.totalValue?.toLocaleString()}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(property.status)}`}>
                          {property.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className={`star-btn ${property.isFeatured ? 'featured' : ''}`}
                          onClick={() => handleToggleFeatured(property._id)}
                        >
                          <FiStar />
                        </button>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {property.status === 'pending' && (
                            <>
                              <button 
                                className="action-btn approve"
                                onClick={() => handleApprove(property._id)}
                                title="Approve"
                              >
                                <FiCheck />
                              </button>
                              <button 
                                className="action-btn reject"
                                onClick={() => handleReject(property._id)}
                                title="Reject"
                              >
                                <FiX />
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
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="dashboard-section full-width">
            <div className="section-header">
              <h2>All Users</h2>
            </div>

            <div className="properties-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user._id}>
                      <td>
                        <strong>{user.firstName} {user.lastName}</strong>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <select 
                          value={user.role}
                          onChange={(e) => handleUpdateRole(user._id, e.target.value)}
                          className="role-select"
                        >
                          <option value="investor">Investor</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button 
                          className={`btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => handleToggleUserActive(user._id)}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Rent Management Tab */}
        {activeTab === 'rent' && (
          <div className="admin-grid">
            <div className="dashboard-section">
              <div className="section-header">
                <h2>Process Rent Payout</h2>
              </div>
              
              <form onSubmit={handleProcessRent} className="rent-form">
                <div className="form-group">
                  <label className="form-label">Select Property</label>
                  <select 
                    className="form-select"
                    value={rentForm.propertyId}
                    onChange={(e) => setRentForm({ ...rentForm, propertyId: e.target.value })}
                    required
                  >
                    <option value="">Choose a property</option>
                    {properties.filter(p => p.status === 'approved').map(p => (
                      <option key={p._id} value={p._id}>
                        {p.title} - Expected: ${p.monthlyRent?.toLocaleString()}/mo
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Month</label>
                    <select 
                      className="form-select"
                      value={rentForm.month}
                      onChange={(e) => setRentForm({ ...rentForm, month: Number(e.target.value) })}
                    >
                      {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <select 
                      className="form-select"
                      value={rentForm.year}
                      onChange={(e) => setRentForm({ ...rentForm, year: Number(e.target.value) })}
                    >
                      {[2024, 2025, 2026].map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Rent Collected ($)</label>
                  <input 
                    type="number"
                    className="form-input"
                    value={rentForm.totalRent}
                    onChange={(e) => setRentForm({ ...rentForm, totalRent: e.target.value })}
                    placeholder="Enter total rent amount"
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-block">
                  <FiTrendingUp /> Process Payout
                </button>
              </form>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2>Recent Payouts</h2>
              </div>
              
              {payouts.length > 0 ? (
                <div className="payouts-list">
                  {payouts.map(payout => (
                    <div key={payout._id} className="payout-item">
                      <div className="payout-info">
                        <strong>{payout.property?.title}</strong>
                        <span>{payout.payoutMonth}/{payout.payoutYear}</span>
                      </div>
                      <div className="payout-details">
                        <span className="amount">${payout.totalDistributed?.toFixed(2)}</span>
                        <span className="investors">{payout.distributions?.length} investors</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No payouts processed yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
