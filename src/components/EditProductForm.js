import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/priceFormatter';
import '../styles/EditProductForm.css';

const EditProductForm = ({ product, onCancel, onUpdate, userRole }) => {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    low_stock_threshold: ''
  });

  // Stock adjustment state
  const [stockAdjustment, setStockAdjustment] = useState({
    type: 'add', // 'add', 'subtract', 'set'
    amount: '',
    reason: ''
  });

  // Component state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);

  // Initialize form with product data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        quantity: product.quantity?.toString() || '',
        low_stock_threshold: product.low_stock_threshold?.toString() || '10'
      });
    }
  }, [product]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle stock adjustment input changes
  const handleStockChange = (e) => {
    const { name, value } = e.target;
    setStockAdjustment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Calculate new stock quantity
  const calculateNewStock = () => {
    const currentStock = parseInt(product.quantity);
    const adjustAmount = parseInt(stockAdjustment.amount) || 0;
    
    switch (stockAdjustment.type) {
      case 'add':
        return currentStock + adjustAmount;
      case 'subtract':
        return Math.max(0, currentStock - adjustAmount);
      case 'set':
        return adjustAmount;
      default:
        return currentStock;
    }
  };

  // Handle basic product update (without stock change)
  const handleProductUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      setError('Product name is required');
      return;
    }
    
    if (parseFloat(formData.price) <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.put(
        `http://localhost:8000/api/products/${product.id}/`,
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          quantity: parseInt(formData.quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold)
        }
      );

      // Log the update action
      await logAuditAction(`Updated product: ${formData.name}`);
      
      onUpdate(response.data);
    } catch (error) {
      console.error('Error updating product:', error);
      setError(error.response?.data?.detail || 'Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  // Handle stock adjustment
  const handleStockAdjustment = async () => {
    if (!stockAdjustment.amount || parseInt(stockAdjustment.amount) <= 0) {
      setError('Please enter a valid adjustment amount');
      return;
    }

    if (!stockAdjustment.reason.trim()) {
      setError('Please provide a reason for stock adjustment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newQuantity = calculateNewStock();
      
      // Update product with new stock
      const response = await axios.put(
        `http://localhost:8000/api/products/${product.id}/`,
        {
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          quantity: newQuantity,
          low_stock_threshold: parseInt(formData.low_stock_threshold)
        }
      );

      // Log the stock adjustment
      const actionLog = `Stock ${stockAdjustment.type}: ${stockAdjustment.amount} units for ${product.name}. Reason: ${stockAdjustment.reason}. New stock: ${newQuantity}`;
      await logAuditAction(actionLog);

      // Reset stock adjustment form
      setStockAdjustment({ type: 'add', amount: '', reason: '' });
      setShowStockModal(false);
      
      onUpdate(response.data);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setError(error.response?.data?.detail || 'Failed to adjust stock');
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

  // Check if user can edit
  const canEdit = userRole === 'manager' || userRole === 'sales';

  if (!canEdit) {
    return (
      <div className="edit-product-form">
        <div className="access-denied">
          <h3>Access Denied</h3>
          <p>You don't have permission to edit products.</p>
          <button onClick={onCancel} className="btn-cancel">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-product-overlay">
      <div className="edit-product-form">
        <h2>Edit Product: {product.name}</h2>
        
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleProductUpdate}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Product Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="price">Price (₦) *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0.01"
                required
              />
              <div className="price-preview">
                {formData.price && `Display: ${formatPrice(parseFloat(formData.price))}`}
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity">Current Stock *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                min="0"
                required
                readOnly
              />
              <small>To change stock, use the "Adjust Stock" button</small>
            </div>

            <div className="form-group">
              <label htmlFor="low_stock_threshold">Low Stock Alert</label>
              <input
                type="number"
                id="low_stock_threshold"
                name="low_stock_threshold"
                value={formData.low_stock_threshold}
                onChange={handleInputChange}
                min="1"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              Cancel
            </button>
            <button 
              type="button" 
              onClick={() => setShowStockModal(true)}
              className="btn-stock"
            >
              📦 Adjust Stock
            </button>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>

        {/* Stock Adjustment Modal */}
        {showStockModal && (
          <div className="stock-modal-overlay">
            <div className="stock-modal">
              <h3>Adjust Stock for {product.name}</h3>
              <p>Current Stock: <strong>{product.quantity} units</strong></p>
              
              <div className="stock-form">
                <div className="form-group">
                  <label>Adjustment Type</label>
                  <select
                    name="type"
                    value={stockAdjustment.type}
                    onChange={handleStockChange}
                  >
                    <option value="add">➕ Add to Stock (New Supply)</option>
                    <option value="subtract">➖ Remove from Stock (Damage/Loss)</option>
                    <option value="set">🔄 Set Exact Amount (Stock Count)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={stockAdjustment.amount}
                    onChange={handleStockChange}
                    min="1"
                    placeholder="Enter quantity"
                  />
                </div>

                <div className="form-group">
                  <label>Reason *</label>
                  <input
                    type="text"
                    name="reason"
                    value={stockAdjustment.reason}
                    onChange={handleStockChange}
                    placeholder="e.g., New supply received, Damaged items, Physical count"
                    required
                  />
                </div>

                {stockAdjustment.amount && (
                  <div className="stock-preview">
                    <p>Current: <span>{product.quantity}</span></p>
                    <p>New Total: <span className="new-stock">{calculateNewStock()}</span></p>
                  </div>
                )}

                <div className="modal-actions">
                  <button 
                    onClick={() => setShowStockModal(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleStockAdjustment}
                    disabled={loading}
                    className="btn-confirm"
                  >
                    {loading ? 'Updating...' : 'Update Stock'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditProductForm;