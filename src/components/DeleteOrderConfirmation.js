import React, { useState } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/priceFormatter';
import '../styles/OrderForms.css';

const DeleteOrderConfirmation = ({ order, onCancel, onOrderDeleted, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  // Required confirmation text
  const requiredText = `DELETE ORDER ${order?.id}`;

  // Handle delete operation
  const handleDelete = async () => {
    if (confirmText !== requiredText) {
      alert('Please type the exact confirmation text');
      return;
    }

    if (!acknowledged) {
      alert('Please acknowledge the consequences of deletion');
      return;
    }

    setLoading(true);

    try {
      // Delete the order (should cascade delete order items)
      await axios.delete(`http://localhost:8000/api/orders/${order.id}/`);
      
      console.log('✅ Order deleted successfully:', order.id);
      onOrderDeleted(order);

    } catch (error) {
      console.error('❌ Error deleting order:', error);
      
      if (error.response?.status === 403) {
        alert('You do not have permission to delete orders.');
      } else if (error.response?.status === 404) {
        alert('Order not found. It may have already been deleted.');
      } else {
        alert('Failed to delete order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!order) return null;

  // Check if user can delete orders
  const canDelete = userRole === 'admin' || userRole === 'manager';

  return (
    <div className="modal-overlay">
      <div className="delete-confirmation-modal">
        <div className="modal-header delete-header">
          <h2>🗑️ Delete Order</h2>
          <button onClick={onCancel} className="close-btn">✕</button>
        </div>

        <div className="modal-content">
          {!canDelete ? (
            <div className="permission-denied">
              <div className="warning-icon">⚠️</div>
              <h3>Permission Denied</h3>
              <p>You do not have permission to delete orders.</p>
              <p>Only administrators and managers can delete orders.</p>
            </div>
          ) : (
            <>
              {/* Warning Section */}
              <div className="warning-section">
                <div className="warning-icon">⚠️</div>
                <h3>Are you absolutely sure?</h3>
                <p>This action <strong>cannot be undone</strong>. This will permanently delete the order and all associated data.</p>
              </div>

              {/* Order Details */}
              <div className="order-summary">
                <h4>📋 Order Details</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">Order ID:</span>
                    <span className="value">#{order.id}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Customer:</span>
                    <span className="value">{order.customer}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Status:</span>
                    <span className={`value status ${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Total Amount:</span>
                    <span className="value amount">{formatPrice(order.total)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Date Created:</span>
                    <span className="value">
                      {order.date_created ? new Date(order.date_created).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Items Count:</span>
                    <span className="value">{order.items?.length || 0} items</span>
                  </div>
                </div>
              </div>

              {/* Order Items Preview */}
              {order.items && order.items.length > 0 && (
                <div className="items-preview">
                  <h4>📦 Items to be deleted ({order.items.length})</h4>
                  <div className="items-list">
                    {order.items.slice(0, 3).map((item, index) => (
                      <div key={index} className="item-preview">
                        <span className="item-name">
                          {item.product?.name || `Product ID: ${item.product}`}
                        </span>
                        <span className="item-details">
                          Qty: {item.quantity} × {formatPrice(item.price)} = {formatPrice(item.quantity * item.price - (item.discount || 0))}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="more-items">
                        ... and {order.items.length - 3} more items
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Consequences Warning */}
              <div className="consequences-section">
                <h4>🚨 What will be deleted:</h4>
                <ul className="consequences-list">
                  <li>✗ The order record (Order #{order.id})</li>
                  <li>✗ All associated order items ({order.items?.length || 0} items)</li>
                  <li>✗ Order history and timestamps</li>
                  <li>✗ Any customer order associations</li>
                  <li>⚠️ This action cannot be reversed</li>
                </ul>
              </div>

              {/* Confirmation Input */}
              <div className="confirmation-section">
                <label htmlFor="confirmText">
                  Please type <code>{requiredText}</code> to confirm:
                </label>
                <input
                  type="text"
                  id="confirmText"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={confirmText === requiredText ? 'valid' : 'invalid'}
                  placeholder={requiredText}
                  disabled={loading}
                />
              </div>

              {/* Acknowledgment Checkbox */}
              <div className="acknowledgment-section">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={acknowledged}
                    onChange={(e) => setAcknowledged(e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  I understand that this action is permanent and cannot be undone
                </label>
              </div>

              {/* Additional Warnings for Special Cases */}
              {order.status === 'Completed' && (
                <div className="special-warning">
                  <div className="warning-icon">🔥</div>
                  <p><strong>Warning:</strong> This is a completed order. Deleting it may affect financial records and reporting.</p>
                </div>
              )}

              {order.status === 'Processing' && (
                <div className="special-warning">
                  <div className="warning-icon">🚧</div>
                  <p><strong>Warning:</strong> This order is currently being processed. Consider cancelling instead of deleting.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Actions */}
        <div className="modal-footer delete-footer">
          <button
            type="button"
            onClick={onCancel}
            className="cancel-btn"
            disabled={loading}
          >
            Cancel
          </button>
          
          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="delete-btn"
              disabled={
                loading || 
                confirmText !== requiredText || 
                !acknowledged
              }
            >
              {loading ? '⏳ Deleting...' : '🗑️ Delete Order'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderConfirmation;