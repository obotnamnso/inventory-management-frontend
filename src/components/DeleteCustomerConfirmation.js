import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/priceFormatter';
import '../styles/Forms.css';

const DeleteCustomerConfirmation = ({ customer, onCancel, onCustomerDeleted, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    fetchCustomerOrders();
  }, [customer]);

  const fetchCustomerOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await axios.get(`http://localhost:8000/api/orders/?customer=${customer.id}`);
      const orders = response.data.results || response.data;
      setCustomerOrders(orders);
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.delete(`http://localhost:8000/api/customers/${customer.id}/`);
      onCustomerDeleted(customer.id);
    } catch (error) {
      console.error('Error deleting customer:', error);
      
      if (error.response?.status === 400) {
        setError('Cannot delete customer with existing orders. Please cancel or complete all orders first.');
      } else if (error.response?.data) {
        setError(error.response.data.detail || 'Failed to delete customer');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Check permissions
  if (userRole !== 'manager') {
    return (
      <div className="modal-overlay">
        <div className="form-modal small-modal">
          <div className="permission-error">
            <h3>Access Denied</h3>
            <p>Only managers can delete customers.</p>
            <button onClick={onCancel} className="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  const hasOrders = customerOrders.length > 0;
  const pendingOrders = customerOrders.filter(order => order.status === 'Pending' || order.status === 'Processing');
  const completedOrders = customerOrders.filter(order => order.status === 'Completed');

  return (
    <div className="modal-overlay">
      <div className="form-modal delete-confirmation-modal">
        <div className="modal-header delete-header">
          <h2>🗑️ Delete Customer</h2>
          <button onClick={onCancel} className="close-btn" disabled={loading}>
            ✕
          </button>
        </div>

        <div className="delete-content">
          {/* Customer Information */}
          <div className="customer-delete-info">
            <div className="customer-avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <div className="customer-details">
              <h3>{customer.name}</h3>
              <p>📧 {customer.email}</p>
              <p>📱 {customer.phone}</p>
              <p>📍 {customer.address}</p>
              {customer.customerTier && (
                <span className={`tier-badge ${customer.customerTier.class}`}>
                  {customer.customerTier.icon} {customer.customerTier.level}
                </span>
              )}
            </div>
          </div>

          {/* Order Statistics */}
          {loadingOrders ? (
            <div className="loading-orders">
              <div className="loading-spinner small"></div>
              <p>Checking customer orders...</p>
            </div>
          ) : (
            <div className="customer-impact-analysis">
              <h4>📊 Impact Analysis</h4>
              <div className="impact-stats">
                <div className="impact-item">
                  <span className="impact-label">Total Orders:</span>
                  <span className="impact-value">{customerOrders.length}</span>
                </div>
                <div className="impact-item">
                  <span className="impact-label">Completed Orders:</span>
                  <span className="impact-value">{completedOrders.length}</span>
                </div>
                <div className="impact-item">
                  <span className="impact-label">Pending Orders:</span>
                  <span className={`impact-value ${pendingOrders.length > 0 ? 'warning' : ''}`}>
                    {pendingOrders.length}
                  </span>
                </div>
                <div className="impact-item">
                  <span className="impact-label">Total Value:</span>
                  <span className="impact-value">{formatPrice(customer.totalSpent || 0)}</span>
                </div>
              </div>

              {/* Warning about orders */}
              {hasOrders && (
                <div className="orders-warning">
                  {pendingOrders.length > 0 ? (
                    <div className="warning-message">
                      <span className="warning-icon">⚠️</span>
                      <div>
                        <strong>Warning: This customer has {pendingOrders.length} pending order(s)!</strong>
                        <p>Deleting this customer may affect order processing. Consider completing or cancelling pending orders first.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="info-message">
                      <span className="info-icon">ℹ️</span>
                      <div>
                        <strong>This customer has order history</strong>
                        <p>Deleting will remove the customer but preserve order records for auditing purposes.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Deletion Warning */}
          <div className="deletion-warning">
            <div className="warning-box">
              <h4>⚠️ Are you absolutely sure?</h4>
              <p>This action <strong>cannot be undone</strong>. This will permanently delete:</p>
              <ul>
                <li>✗ Customer profile and contact information</li>
                <li>✗ Customer notes and history</li>
                <li>✗ Customer tier and statistics</li>
                {hasOrders && <li>⚠️ Customer reference from {customerOrders.length} order(s)</li>}
              </ul>
              
              <div className="confirmation-input">
                <label>
                  Type <strong>{customer.name}</strong> to confirm deletion:
                </label>
                <input
                  type="text"
                  placeholder={`Type "${customer.name}" here`}
                  id="confirmationInput"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}
        </div>

        <div className="form-actions delete-actions">
          <button
            onClick={onCancel}
            className="btn-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const confirmationInput = document.getElementById('confirmationInput');
              if (confirmationInput.value === customer.name) {
                handleDelete();
              } else {
                setError('Please type the customer name exactly to confirm deletion.');
              }
            }}
            className="btn-danger"
            disabled={loading || loadingOrders}
          >
            {loading ? (
              <>
                <span className="loading-spinner small"></span>
                Deleting Customer...
              </>
            ) : (
              '🗑️ Delete Customer'
            )}
          </button>
        </div>

        {/* Additional Safety Message */}
        <div className="safety-note">
          <small>
            💡 <strong>Alternative:</strong> Instead of deleting, consider marking the customer as inactive 
            or adding a note that they're no longer active. This preserves historical data.
          </small>
        </div>
      </div>
    </div>
  );
};

export default DeleteCustomerConfirmation;