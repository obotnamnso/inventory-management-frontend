import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/priceFormatter';
import '../styles/OrderForms.css';

const AddOrderForm = ({ onCancel, onOrderAdded, customers, products, userRole }) => {
  // Form state
  const [formData, setFormData] = useState({
    customer: '',
    status: 'Pending'
  });

  // Order items state
  const [orderItems, setOrderItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({
    product: '',
    quantity: 1,
    price: '',
    discount: 0
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableProducts, setAvailableProducts] = useState(products || []);

  useEffect(() => {
    setAvailableProducts(products || []);
  }, [products]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle item field changes
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'product') {
      const selectedProduct = availableProducts.find(p => p.id === parseInt(value));
      setCurrentItem(prev => ({
        ...prev,
        [name]: value,
        price: selectedProduct ? selectedProduct.price : ''
      }));
    } else {
      setCurrentItem(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add item to order
  const addItemToOrder = () => {
    // Validate item
    if (!currentItem.product) {
      alert('Please select a product');
      return;
    }
    
    if (!currentItem.quantity || currentItem.quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    if (!currentItem.price || currentItem.price <= 0) {
      alert('Please enter a valid price');
      return;
    }

    // Check if product already exists in order
    const existingItemIndex = orderItems.findIndex(item => item.product === currentItem.product);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...orderItems];
      updatedItems[existingItemIndex].quantity = parseInt(updatedItems[existingItemIndex].quantity) + parseInt(currentItem.quantity);
      setOrderItems(updatedItems);
    } else {
      // Add new item
      const selectedProduct = availableProducts.find(p => p.id === parseInt(currentItem.product));
      const newItem = {
        ...currentItem,
        productName: selectedProduct?.name || 'Unknown Product',
        productDetails: selectedProduct
      };
      setOrderItems(prev => [...prev, newItem]);
    }

    // Reset current item
    setCurrentItem({
      product: '',
      quantity: 1,
      price: '',
      discount: 0
    });
  };

  // Remove item from order
  const removeItemFromOrder = (index) => {
    setOrderItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item in order
  const updateOrderItem = (index, field, value) => {
    setOrderItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Calculate totals
  const calculateItemTotal = (item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    const discount = parseFloat(item.discount) || 0;
    return (price * quantity) - discount;
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }

    if (orderItems.length === 0) {
      newErrors.items = 'At least one item is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Find customer ID from the selected customer name
      const selectedCustomer = customers.find(c => c.name === formData.customer);
      if (!selectedCustomer) {
        alert('Selected customer not found. Please refresh and try again.');
        setLoading(false);
        return;
      }

      // Create the order with customer_id instead of customer name
      const orderResponse = await axios.post('http://localhost:8000/api/orders/', {
        customer_id: selectedCustomer.id,
        status: formData.status,
        total: calculateOrderTotal().toFixed(2)
      });

      const orderId = orderResponse.data.id;

      // Create order items
      const itemPromises = orderItems.map(item => 
        axios.post('http://localhost:8000/api/order-items/', {
          order_id: orderId,
          product_id: parseInt(item.product),
          quantity: parseInt(item.quantity),
          price: parseFloat(item.price).toFixed(2),
          discount: parseFloat(item.discount || 0).toFixed(2)
        })
      );

      try {
        await Promise.all(itemPromises);
        console.log('✅ Order and items created successfully:', orderId);
        onOrderAdded(orderResponse.data);
      } catch (itemError) {
        console.error('❌ Error creating order items:', itemError);
        // If order items fail, we should inform the user but the order was still created
        alert(`Order ${orderId} was created but some items failed to save. Please edit the order to add missing items.`);
        onOrderAdded(orderResponse.data);
      }

    } catch (error) {
      console.error('❌ Error creating order:', error);
      
      if (error.response?.data) {
        const serverErrors = error.response.data;
        setErrors(serverErrors);
      } else {
        alert('Failed to create order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="order-form-modal">
        <div className="modal-header">
          <h2>➕ Create New Order</h2>
          <button onClick={onCancel} className="close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="order-form">
          <div className="modal-content">
            {/* Order Information */}
            <div className="form-section">
              <h3>📋 Order Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customer">Customer *</label>
                  <select
                    id="customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    className={errors.customer ? 'error' : ''}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.name}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {errors.customer && <span className="error-message">{errors.customer}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Add Items Section */}
            <div className="form-section">
              <h3>📦 Add Items</h3>
              
              <div className="add-item-form">
                <div className="item-form-row">
                  <div className="form-group">
                    <label htmlFor="product">Product</label>
                    <select
                      id="product"
                      name="product"
                      value={currentItem.product}
                      onChange={handleItemChange}
                    >
                      <option value="">Select Product</option>
                      {availableProducts.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name} (Stock: {product.quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="quantity">Quantity</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={currentItem.quantity}
                      onChange={handleItemChange}
                      min="1"
                      className="quantity-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="price">Unit Price</label>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={currentItem.price}
                      onChange={handleItemChange}
                      step="0.01"
                      min="0"
                      className="price-input"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="discount">Discount</label>
                    <input
                      type="number"
                      id="discount"
                      name="discount"
                      value={currentItem.discount}
                      onChange={handleItemChange}
                      step="0.01"
                      min="0"
                      className="discount-input"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <button
                      type="button"
                      onClick={addItemToOrder}
                      className="add-item-btn"
                      disabled={!currentItem.product || !currentItem.quantity || !currentItem.price}
                    >
                      ➕ Add
                    </button>
                  </div>
                </div>
              </div>

              {errors.items && <span className="error-message">{errors.items}</span>}
            </div>

            {/* Order Items List */}
            {orderItems.length > 0 && (
              <div className="form-section">
                <h3>🛒 Order Items ({orderItems.length})</h3>
                
                <div className="order-items-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Discount</th>
                        <th>Total</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderItems.map((item, index) => (
                        <tr key={index}>
                          <td className="product-cell">
                            <strong>{item.productName}</strong>
                          </td>
                          <td className="quantity-cell">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', e.target.value)}
                              min="1"
                              className="table-input"
                            />
                          </td>
                          <td className="price-cell">
                            <input
                              type="number"
                              value={item.price}
                              onChange={(e) => updateOrderItem(index, 'price', e.target.value)}
                              step="0.01"
                              min="0"
                              className="table-input"
                            />
                          </td>
                          <td className="discount-cell">
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => updateOrderItem(index, 'discount', e.target.value)}
                              step="0.01"
                              min="0"
                              className="table-input"
                            />
                          </td>
                          <td className="total-cell">
                            <strong>{formatPrice(calculateItemTotal(item))}</strong>
                          </td>
                          <td className="actions-cell">
                            <button
                              type="button"
                              onClick={() => removeItemFromOrder(index)}
                              className="remove-item-btn"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Order Total */}
                <div className="order-total-section">
                  <div className="total-row">
                    <span className="total-label">Order Total:</span>
                    <span className="total-amount">{formatPrice(calculateOrderTotal())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onCancel}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || orderItems.length === 0}
            >
              {loading ? '⏳ Creating...' : '✅ Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrderForm;