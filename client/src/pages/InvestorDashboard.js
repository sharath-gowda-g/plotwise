import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiDollarSign, FiTrendingUp, FiPieChart, FiHome, FiClock, FiArrowRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Dashboard.css';

const InvestorDashboard = () => {
  const [summary, setSummary] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [summaryRes, investmentsRes, transactionsRes] = await Promise.all([
        api.get('/investments/dashboard/summary'),
        api.get('/investments'),
        api.get('/transactions?limit=5')
      ]);

      setSummary(summaryRes.data);
      setInvestments(investmentsRes.data.investments);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <h1>Investor Dashboard</h1>
          <Link to="/properties" className="btn btn-primary">
            Browse Properties <FiArrowRight />
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon portfolio">
              <FiPieChart />
            </div>
            <div className="stat-content">
              <span className="stat-label">Portfolio Value</span>
              <span className="stat-value">${summary?.portfolioValue?.toLocaleString() || 0}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon invested">
              <FiDollarSign />
            </div>
            <div className="stat-content">
              <span className="stat-label">Total Invested</span>
              <span className="stat-value">${summary?.totalInvested?.toLocaleString() || 0}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon income">
              <FiTrendingUp />
            </div>
            <div className="stat-content">
              <span className="stat-label">Monthly Income</span>
              <span className="stat-value">${summary?.monthlyIncome?.toFixed(2) || 0}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon properties">
              <FiHome />
            </div>
            <div className="stat-content">
              <span className="stat-label">Properties</span>
              <span className="stat-value">{summary?.totalProperties || 0}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Investments */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>My Investments</h2>
              <span className="badge badge-primary">{investments.length} Properties</span>
            </div>

            {investments.length > 0 ? (
              <div className="investments-list">
                {investments.map((investment) => (
                  <div key={investment._id} className="investment-card">
                    <div className="investment-image">
                      <img 
                        src={investment.property?.images?.[0]?.url || 'https://via.placeholder.com/100'} 
                        alt={investment.property?.title} 
                      />
                    </div>
                    <div className="investment-info">
                      <h3>
                        <Link to={`/properties/${investment.property?._id}`}>
                          {investment.property?.title}
                        </Link>
                      </h3>
                      <p>{investment.property?.location?.city}, {investment.property?.location?.state}</p>
                    </div>
                    <div className="investment-stats">
                      <div className="mini-stat">
                        <span className="label">Tokens</span>
                        <span className="value">{investment.tokensOwned}</span>
                      </div>
                      <div className="mini-stat">
                        <span className="label">Value</span>
                        <span className="value">${investment.currentValue?.toLocaleString()}</span>
                      </div>
                      <div className="mini-stat">
                        <span className="label">Monthly Rent</span>
                        <span className="value rent">${investment.monthlyRentShare?.toFixed(2)}</span>
                      </div>
                      <div className="mini-stat">
                        <span className="label">Ownership</span>
                        <span className="value">{investment.ownershipPercentage?.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FiHome className="empty-icon" />
                <h3>No Investments Yet</h3>
                <p>Start building your portfolio by investing in properties</p>
                <Link to="/properties" className="btn btn-primary">
                  Browse Properties
                </Link>
              </div>
            )}
          </div>

          {/* Recent Transactions */}
          <div className="dashboard-section">
            <div className="section-header">
              <h2>Recent Transactions</h2>
              <Link to="/wallet" className="view-all">View All</Link>
            </div>

            {transactions.length > 0 ? (
              <div className="transactions-list">
                {transactions.map((tx) => (
                  <div key={tx._id} className="transaction-item">
                    <div className={`tx-icon ${tx.transactionType}`}>
                      {tx.transactionType === 'token_purchase' ? <FiHome /> : 
                       tx.transactionType === 'rent_payout' ? <FiTrendingUp /> : <FiDollarSign />}
                    </div>
                    <div className="tx-info">
                      <span className="tx-type">
                        {tx.transactionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="tx-date">
                        <FiClock /> {new Date(tx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className={`tx-amount ${tx.transactionType.includes('purchase') || tx.transactionType.includes('withdrawal') ? 'negative' : 'positive'}`}>
                      {tx.transactionType.includes('purchase') || tx.transactionType.includes('withdrawal') ? '-' : '+'}
                      ${tx.amount?.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-data">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDashboard;
