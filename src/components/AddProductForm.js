import React, { useState } from 'react';
import apiService from '../services/api';
import { formatPrice, parsePrice } from '../utils/priceFormatter';
import './AddProductForm.css';

const AddProductForm = ({ onProductAdded, onCancel, userRole = 'manager' }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: '',
    price: '',
    low_stock_threshold: '10'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  // Check if user has permission to add products
  const canAddProducts = userRole === 'manager' || userRole === 'sales';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Product name must be at least 2 characters';
    }

    // Quantity validation
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required';
    } else if (parseInt(formData.quantity) < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    } else if (!Number.isInteger(Number(formData.quantity))) {
      newErrors.quantity = 'Quantity must be a whole number';
    }

    // Price validation
    if (!formData.price) {
      newErrors.price = 'Price is required';
    } else if (parseFloat(formData.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    // Low stock threshold validation
    if (formData.low_stock_threshold && parseInt(formData.low_stock_threshold) < 0) {
      newErrors.low_stock_threshold = 'Low stock threshold cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!canAddProducts) {
      setSubmitError('You do not have permission to add products');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSubmitError('');

    try {
      // Convert string values to appropriate types
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price).toFixed(2),
        low_stock_threshold: parseInt(formData.low_stock_threshold) || 10
      };

      const response = await apiService.products.create(productData);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        quantity: '',
        price: '',
        low_stock_threshold: '10'
      });
      
      // Notify parent component
      onProductAdded(response.data);
      
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      
      if (error.response?.data) {
        // Handle Django validation errors
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
        } else {
          setSubmitError('Failed to add product: ' + (backendErrors.detail || 'Unknown error'));
        }
      } else {
        setSubmitError('Failed to add product. Please check your internet connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!canAddProducts) {
    return (
      <div className="add-product-form permission-denied">
        <h3>Access Denied</h3>
        <p>You need Manager or Sales privileges to add new products.</p>
        <p>Current role: <span className="user-role">{userRole}</span></p>
        <button onClick={onCancel} className="cancel-btn">Close</button>
      </div>
    );
  }

  return (
    <div className="add-product-form">
      <div className="form-header">
        <h3>Add New Product</h3>
        <p className="user-info">Logged in as: <span className="user-role">{userRole}</span></p>
      </div>

      <form onSubmit={handleSubmit} className="product-form">
        {submitError && (
          <div className="error-message">
            {submitError}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name">Product Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? 'error' : ''}
            placeholder="Enter product name"
            maxLength="100"
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter product description (optional)"
            rows="3"
          />
          {errors.description && <span className="field-error">{errors.description}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleInputChange}
              className={errors.quantity ? 'error' : ''}
              placeholder="0"
              min="0"
            />
            {formData.quantity && (
              <div className="quantity-preview">
                Preview: {parseInt(formData.quantity || 0).toLocaleString('en-US')} units
              </div>
            )}
            {errors.quantity && <span className="field-error">{errors.quantity}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (₦) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleInputChange}
              className={errors.price ? 'error' : ''}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            {formData.price && (
              <div className="price-preview">
                Preview: {formatPrice(formData.price)}
              </div>
            )}
            {errors.price && <span className="field-error">{errors.price}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="low_stock_threshold">Low Stock Alert</label>
            <input
              type="number"
              id="low_stock_threshold"
              name="low_stock_threshold"
              value={formData.low_stock_threshold}
              onChange={handleInputChange}
              className={errors.low_stock_threshold ? 'error' : ''}
              placeholder="10"
              min="0"
            />
            {errors.low_stock_threshold && <span className="field-error">{errors.low_stock_threshold}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Adding Product...' : 'Add Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddProductForm;