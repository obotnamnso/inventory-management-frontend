import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/StockHistory.css';

const StockHistory = ({ productId, onClose }) => {
  const [stockHistory, setStockHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStockHistory();
  }, [productId]);

  const fetchStockHistory = async () => {
    try {
      setLoading(true);
      // Fetch audit logs related to this product's stock changes
      const response = await axios.get(`http://localhost:8000/api/audit-logs/`);
      
      // Handle Django REST API pagination format
      const auditData = response.data.results || response.data;
      
      // Filter logs related to this product (you might need to adjust this based on your API)
      const productLogs = auditData.filter(log => 
        log.action.toLowerCase().includes('stock') ||
        log.action.toLowerCase().includes('updated product') ||
        log.action.toLowerCase().includes('added product')
      );
      
      setStockHistory(productLogs);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      setError('Failed to load stock history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getActionType = (action) => {
    if (action.toLowerCase().includes('stock add')) return { type: 'add', icon: '📦', color: '#10b981' };
    if (action.toLowerCase().includes('stock subtract')) return { type: 'subtract', icon: '📤', color: '#f59e0b' };
    if (action.toLowerCase().includes('stock set')) return { type: 'set', icon: '🔄', color: '#3b82f6' };
    if (action.toLowerCase().includes('updated product')) return { type: 'update', icon: '✏️', color: '#8b5cf6' };
    if (action.toLowerCase().includes('added product')) return { type: 'create', icon: '➕', color: '#06b6d4' };
    return { type: 'other', icon: '📋', color: '#6b7280' };
  };

  if (loading) {
    return (
      <div className="stock-history-overlay">
        <div className="stock-history-modal">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading stock history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-history-overlay">
      <div className="stock-history-modal">
        <div className="modal-header">
          <h2>📊 Stock Movement History</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="modal-content">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {stockHistory.length === 0 ? (
            <div className="no-history">
              <p>📋 No stock movements found for this product.</p>
            </div>
          ) : (
            <div className="history-list">
              {stockHistory.map((entry, index) => {
                const actionInfo = getActionType(entry.action);
                return (
                  <div key={index} className="history-item">
                    <div className="history-icon" style={{ backgroundColor: actionInfo.color }}>
                      {actionInfo.icon}
                    </div>
                    <div className="history-details">
                      <div className="history-action">
                        {entry.action}
                      </div>
                      <div className="history-meta">
                        <span className="history-date">
                          📅 {formatDate(entry.log_time)}
                        </span>
                        <span className="history-user">
                          👤 User ID: {entry.user}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-close">
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockHistory;