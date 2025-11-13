import React, { useState } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/priceFormatter';
import '../styles/DeleteConfirmation.css';

const DeleteConfirmation = ({ product, onCancel, onDelete, userRole }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmText, setConfirmText] = useState('');

  // Check if user can delete
  const canDelete = userRole === 'manager';

  // Handle delete confirmation
  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.delete(`http://localhost:8000/api/products/${product.id}/`);
      
      // Log the delete action
      await logAuditAction(`Deleted product: ${product.name} (ID: ${product.id})`);
      
      onDelete(product.id);
    } catch (error) {
      console.error('Error deleting product:', error);
      setError(error.response?.data?.detail || 'Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  // Log audit action
  const logAuditAction = async (action) => {
    try {
      // For now, we'll skip audit logging since we don't have user authentication
      // In production, you would get the user ID from your auth context
      console.log('Audit Log:', action);
      
      // Uncomment when you have user authentication:
      // await axios.post('http://localhost:8000/api/audit-logs/', {
      //   action: action,
      //   user: currentUser.id
      // });
    } catch (error) {
      console.warn('Failed to log audit action:', error);
    }
  };

  if (!canDelete) {
    return (
      <div className="delete-overlay">
        <div className="delete-confirmation">
          <div className="access-denied">
            <h3>❌ Access Denied</h3>
            <p>Only managers can delete products.</p>
            <button onClick={onCancel} className="btn-cancel">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="delete-overlay">
      <div className="delete-confirmation">
        <div className="warning-icon">⚠️</div>
        
        <h2>Delete Product</h2>
        
        <div className="product-info">
          <h3>{product.name}</h3>
          <div className="product-details">
            <p><strong>Current Stock:</strong> {product.quantity} units</p>
            <p><strong>Price:</strong> {formatPrice(product.price)}</p>
            <p><strong>Value:</strong> {formatPrice(product.price * product.quantity)}</p>
          </div>
        </div>

        <div className="warning-message">
          <p>⚠️ <strong>This action cannot be undone!</strong></p>
          <p>Deleting this product will:</p>
          <ul>
            <li>Remove all product information permanently</li>
            <li>Remove it from all future reports</li>
            <li>This may affect existing orders that reference this product</li>
          </ul>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="confirmation-input">
          <label>
            Type <strong>DELETE</strong> to confirm:
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
            placeholder="Type DELETE here"
            autoComplete="off"
          />
        </div>

        <div className="action-buttons">
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button 
            onClick={handleDelete}
            disabled={loading || confirmText !== 'DELETE'}
            className="btn-delete"
          >
            {loading ? 'Deleting...' : '🗑️ Delete Product'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;