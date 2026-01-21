import React, { useState, useEffect } from 'react';
import { FiDollarSign, FiArrowUpRight, FiArrowDownRight, FiCreditCard, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Wallet.css';

const Wallet = () => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const [walletRes, txRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/transactions')
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data.transactions || []);
    } catch (error) {
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post('/wallet/deposit', { amount });
      toast.success(`Successfully deposited $${amount.toLocaleString()}`);
      setWallet(res.data.wallet);
      setDepositAmount('');
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Deposit failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post('/wallet/withdraw', { amount });
      toast.success(`Successfully withdrew $${amount.toLocaleString()}`);
      setWallet(res.data.wallet);
      setWithdrawAmount('');
      fetchWalletData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Withdrawal failed');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type) => {
    const icons = {
      deposit: <FiArrowDownRight className="icon deposit" />,
      withdrawal: <FiArrowUpRight className="icon withdrawal" />,
      token_purchase: <FiCreditCard className="icon purchase" />,
      rent_income: <FiDollarSign className="icon income" />,
      token_sale: <FiArrowUpRight className="icon sale" />
    };
    return icons[type] || <FiClock className="icon" />;
  };

  const formatTransactionType = (type) => {
    const types = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      token_purchase: 'Token Purchase',
      rent_income: 'Rent Income',
      token_sale: 'Token Sale'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="container">
        <div className="wallet-header">
          <h1>My Wallet</h1>
        </div>

        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-info">
            <span className="balance-label">Available Balance</span>
            <h2 className="balance-amount">${wallet?.balance?.toLocaleString() || '0.00'}</h2>
          </div>
          <div className="balance-actions">
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('deposit')}
            >
              <FiArrowDownRight /> Deposit
            </button>
            <button 
              className="btn btn-outline"
              onClick={() => setActiveTab('withdraw')}
            >
              <FiArrowUpRight /> Withdraw
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="wallet-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Transaction History
          </button>
          <button 
            className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
            onClick={() => setActiveTab('deposit')}
          >
            Deposit Funds
          </button>
          <button 
            className={`tab ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw Funds
          </button>
        </div>

        {/* Transaction History */}
        {activeTab === 'overview' && (
          <div className="transactions-section">
            <h2>Recent Transactions</h2>
            {transactions.length > 0 ? (
              <div className="transactions-list">
                {transactions.map(tx => (
                  <div key={tx._id} className="transaction-item">
                    <div className="tx-icon">
                      {getTransactionIcon(tx.transactionType)}
                    </div>
                    <div className="tx-info">
                      <span className="tx-type">{formatTransactionType(tx.transactionType)}</span>
                      <span className="tx-date">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {tx.property && (
                        <span className="tx-property">{tx.property.title}</span>
                      )}
                    </div>
                    <div className={`tx-amount ${tx.transactionType === 'withdrawal' || tx.transactionType === 'token_purchase' ? 'negative' : 'positive'}`}>
                      {tx.transactionType === 'withdrawal' || tx.transactionType === 'token_purchase' ? '-' : '+'}
                      ${tx.amount?.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-transactions">
                <FiClock size={48} />
                <h3>No transactions yet</h3>
                <p>Your transaction history will appear here once you start investing.</p>
              </div>
            )}
          </div>
        )}

        {/* Deposit Form */}
        {activeTab === 'deposit' && (
          <div className="wallet-form-section">
            <h2>Deposit Funds</h2>
            <p className="form-description">
              Add funds to your wallet to start investing in properties. 
              This is a mock payment system for demonstration purposes.
            </p>

            <form onSubmit={handleDeposit} className="wallet-form">
              <div className="form-group">
                <label className="form-label">Amount to Deposit ($)</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input 
                    type="number"
                    className="form-input amount-input"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="quick-amounts">
                <span>Quick amounts:</span>
                <button type="button" onClick={() => setDepositAmount('100')}>$100</button>
                <button type="button" onClick={() => setDepositAmount('500')}>$500</button>
                <button type="button" onClick={() => setDepositAmount('1000')}>$1,000</button>
                <button type="button" onClick={() => setDepositAmount('5000')}>$5,000</button>
              </div>

              <div className="mock-payment-notice">
                <FiCreditCard />
                <span>Mock Payment - No real money will be charged</span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-block"
                disabled={processing}
              >
                {processing ? 'Processing...' : `Deposit $${depositAmount || '0.00'}`}
              </button>
            </form>
          </div>
        )}

        {/* Withdraw Form */}
        {activeTab === 'withdraw' && (
          <div className="wallet-form-section">
            <h2>Withdraw Funds</h2>
            <p className="form-description">
              Withdraw funds from your wallet. Available balance: 
              <strong> ${wallet?.balance?.toLocaleString() || '0.00'}</strong>
            </p>

            <form onSubmit={handleWithdraw} className="wallet-form">
              <div className="form-group">
                <label className="form-label">Amount to Withdraw ($)</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">$</span>
                  <input 
                    type="number"
                    className="form-input amount-input"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    min="1"
                    max={wallet?.balance || 0}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="quick-amounts">
                <span>Quick amounts:</span>
                <button 
                  type="button" 
                  onClick={() => setWithdrawAmount((wallet?.balance * 0.25).toFixed(2))}
                >
                  25%
                </button>
                <button 
                  type="button" 
                  onClick={() => setWithdrawAmount((wallet?.balance * 0.5).toFixed(2))}
                >
                  50%
                </button>
                <button 
                  type="button" 
                  onClick={() => setWithdrawAmount((wallet?.balance * 0.75).toFixed(2))}
                >
                  75%
                </button>
                <button 
                  type="button" 
                  onClick={() => setWithdrawAmount(wallet?.balance?.toFixed(2))}
                >
                  Max
                </button>
              </div>

              <div className="mock-payment-notice warning">
                <FiArrowUpRight />
                <span>Mock Withdrawal - Funds will be deducted from wallet</span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg btn-block"
                disabled={processing || !wallet?.balance}
              >
                {processing ? 'Processing...' : `Withdraw $${withdrawAmount || '0.00'}`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
