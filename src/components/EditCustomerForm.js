import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/Forms.css';

const EditCustomerForm = ({ customer, onCancel, onCustomerUpdated, userRole }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'Lagos',
    postal_code: '',
    company: '',
    notes: ''
  });

  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Nigerian states for dropdown
  const nigerianStates = [
    'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
    'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
    'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
    'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
    'Yobe', 'Zamfara'
  ];

  useEffect(() => {
    if (customer) {
      const initialData = {
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || 'Lagos',
        postal_code: customer.postal_code || '',
        company: customer.company || '',
        notes: customer.notes || ''
      };
      setFormData(initialData);
      setOriginalData(initialData);
    }
  }, [customer]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const hasChanges = () => {
    return Object.keys(formData).some(key => formData[key] !== originalData[key]);
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation (Nigerian format)
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^(\+234|0)[789]\d{9}$/.test(formData.phone.replace(/\s+/g, ''))) {
      newErrors.phone = 'Please enter a valid Nigerian phone number';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhoneNumber = (phone) => {
    // Convert to standard format
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('0')) {
      cleaned = '+234' + cleaned.substring(1);
    } else if (!cleaned.startsWith('234')) {
      cleaned = '+234' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hasChanges()) {
      setErrors({ general: 'No changes detected. Please modify at least one field.' });
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      // Format phone number
      const customerData = {
        ...formData,
        phone: formatPhoneNumber(formData.phone),
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        company: formData.company.trim(),
        notes: formData.notes.trim()
      };

      const response = await axios.put(`http://localhost:8000/api/customers/${customer.id}/`, customerData);

      setSuccessMessage('Customer updated successfully!');
      
      // Call parent callback with the updated customer data
      setTimeout(() => {
        onCustomerUpdated(response.data);
      }, 1000);

    } catch (error) {
      console.error('Error updating customer:', error);
      
      if (error.response?.data) {
        // Handle validation errors from backend
        const backendErrors = error.response.data;
        if (typeof backendErrors === 'object') {
          setErrors(backendErrors);
        } else {
          setErrors({ general: 'Failed to update customer: ' + backendErrors });
        }
      } else {
        setErrors({ general: 'Network error. Please check your connection and try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges()) {
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  const resetForm = () => {
    setFormData(originalData);
    setErrors({});
    setSuccessMessage('');
  };

  // Check permissions
  if (userRole === 'viewer') {
    return (
      <div className="modal-overlay">
        <div className="form-modal">
          <div className="permission-error">
            <h3>Access Denied</h3>
            <p>You don't have permission to edit customers.</p>
            <button onClick={onCancel} className="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="form-modal edit-customer-modal">
        <div className="modal-header">
          <h2>✏️ Edit Customer - {customer?.name}</h2>
          <button onClick={handleCancel} className="close-btn" disabled={loading}>
            ✕
          </button>
        </div>

        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            {successMessage}
          </div>
        )}

        {errors.general && (
          <div className="error-message">
            <span className="error-icon">❌</span>
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="edit-customer-form">
          <div className="form-grid">
            {/* Personal Information Section */}
            <div className="form-section">
              <h3 className="section-title">👤 Personal Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter customer's full name"
                  disabled={loading}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                  placeholder="customer@example.com"
                  disabled={loading}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={errors.phone ? 'error' : ''}
                  placeholder="+234 802 123 4567 or 08021234567"
                  disabled={loading}
                />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
                <small className="field-hint">Nigerian format: +234XXXXXXXXX or 0XXXXXXXXXX</small>
              </div>

              <div className="form-group">
                <label htmlFor="company">Company (Optional)</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder="Company name"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Address Information Section */}
            <div className="form-section">
              <h3 className="section-title">📍 Address Information</h3>
              
              <div className="form-group">
                <label htmlFor="address">Street Address *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={errors.address ? 'error' : ''}
                  placeholder="123 Main Street, Area Name"
                  disabled={loading}
                />
                {errors.address && <span className="field-error">{errors.address}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={errors.city ? 'error' : ''}
                    placeholder="Lagos, Abuja, etc."
                    disabled={loading}
                  />
                  {errors.city && <span className="field-error">{errors.city}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    {nigerianStates.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="postal_code">Postal Code (Optional)</label>
                <input
                  type="text"
                  id="postal_code"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="100001"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes (Optional)</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Additional notes about the customer..."
                  rows="3"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-outline"
              disabled={loading || !hasChanges()}
            >
              Reset Changes
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !hasChanges()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner small"></span>
                  Updating Customer...
                </>
              ) : (
                '💾 Save Changes'
              )}
            </button>
          </div>
        </form>

        {/* Customer Statistics Preview */}
        {customer && (
          <div className="customer-preview-stats">
            <h4>Customer Statistics</h4>
            <div className="stats-preview">
              <div className="preview-stat">
                <span className="label">Total Orders:</span>
                <span className="value">{customer.totalOrders || 0}</span>
              </div>
              <div className="preview-stat">
                <span className="label">Total Spent:</span>
                <span className="value">₦{(customer.totalSpent || 0).toLocaleString('en-NG')}</span>
              </div>
              <div className="preview-stat">
                <span className="label">Customer Tier:</span>
                <span className={`tier-badge ${customer.customerTier?.class || 'new'}`}>
                  {customer.customerTier?.icon} {customer.customerTier?.level || 'New'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCustomerForm;