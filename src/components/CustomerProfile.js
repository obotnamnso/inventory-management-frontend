import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/priceFormatter';
import '../styles/CustomerProfile.css';

const CustomerProfile = ({ customer, onClose }) => {
  const [customerOrders, setCustomerOrders] = useState([]);
  const [orderItems, setOrderItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (customer) {
      fetchCustomerData();
    }
  }, [customer]);

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch customer orders and order items
      const [ordersResponse, orderItemsResponse] = await Promise.all([
        axios.get(`http://localhost:8000/api/orders/?customer=${customer.id}`),
        axios.get('http://localhost:8000/api/order-items/')
      ]);

      const orders = ordersResponse.data.results || ordersResponse.data;
      const allOrderItems = orderItemsResponse.data.results || orderItemsResponse.data;

      console.log('Sample order item:', allOrderItems[0]);

      // Filter order items for customer's orders and extract product names
      const orderItemsMap = {};
      orders.forEach(order => {
        const orderItems = allOrderItems.filter(item => item.order === order.id);
        console.log(`Order ${order.id} items:`, orderItems);
        
        orderItemsMap[order.id] = orderItems.map(item => {
          // Handle both nested object and direct ID cases
          const productName = item.product?.name || 
                              (typeof item.product === 'object' ? item.product.name : null) ||
                              `Product #${item.product}`;
          
          console.log(`Item product:`, item.product, `-> Name: ${productName}`);
          
          return {
            ...item,
            product_name: productName
          };
        });
      });

      console.log('Customer orders:', orders);
      console.log('Order items map:', orderItemsMap);

      setCustomerOrders(orders);
      setOrderItems(orderItemsMap);
    } catch (error) {
      console.error('Error fetching customer data:', error);
      setError('Failed to load customer data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getOrderStats = () => {
    const completedOrders = customerOrders.filter(order => order.status === 'Completed');
    const pendingOrders = customerOrders.filter(order => order.status === 'Pending' || order.status === 'Processing');
    const totalSpent = completedOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
    const averageOrderValue = completedOrders.length > 0 ? totalSpent / completedOrders.length : 0;

    // Get most purchased products
    const productCounts = {};
    customerOrders.forEach(order => {
      const items = orderItems[order.id] || [];
      items.forEach(item => {
        const productName = item.product_name || 'Unknown Product';
        const quantity = parseInt(item.quantity) || 0;
        
        if (productCounts[productName]) {
          productCounts[productName] += quantity;
        } else {
          productCounts[productName] = quantity;
        }
      });
    });

    const topProducts = Object.entries(productCounts)
      .filter(([name, quantity]) => name !== 'Unknown Product' && quantity > 0)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name, quantity]) => ({ name, quantity }));

    return {
      totalOrders: customerOrders.length,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      totalSpent,
      averageOrderValue,
      topProducts,
      lastOrderDate: customerOrders.length > 0 
        ? new Date(Math.max(...customerOrders.map(order => new Date(order.order_date))))
        : null
    };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="profile-modal">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading customer profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="profile-modal">
          <div className="error-state">
            <h3>Error Loading Profile</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={fetchCustomerData} className="retry-btn">
                🔄 Try Again
              </button>
              <button onClick={onClose} className="close-btn">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <div className="modal-overlay">
      <div className="profile-modal customer-profile">
        {/* Header */}
        <div className="profile-header">
          <div className="customer-info">
            <div className="customer-avatar">
              <span className="avatar-icon">👤</span>
            </div>
            <div className="customer-details">
              <h2>{customer.name}</h2>
              <p className="customer-email">📧 {customer.email}</p>
              <p className="customer-phone">📱 {customer.phone}</p>
              {customer.customerTier && (
                <span className={`tier-badge ${customer.customerTier.class}`}>
                  {customer.customerTier.icon} {customer.customerTier.level} Customer
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={activeTab === 'overview' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={activeTab === 'orders' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('orders')}
          >
            📦 Orders ({stats.totalOrders})
          </button>
          <button
            className={activeTab === 'analytics' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          <button
            className={activeTab === 'contact' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('contact')}
          >
            📞 Contact Info
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* Quick Stats */}
              <div className="quick-stats">
                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-info">
                    <h3>{stats.totalOrders}</h3>
                    <p>Total Orders</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <h3>{formatPrice(stats.totalSpent)}</h3>
                    <p>Total Spent</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <h3>{formatPrice(stats.averageOrderValue)}</h3>
                    <p>Avg. Order Value</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">⏰</div>
                  <div className="stat-info">
                    <h3>{stats.pendingOrders}</h3>
                    <p>Pending Orders</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h3>📋 Recent Activity</h3>
                {stats.lastOrderDate && (
                  <div className="activity-item">
                    <span className="activity-icon">📦</span>
                    <div className="activity-content">
                      <p><strong>Last Order:</strong> {formatDate(stats.lastOrderDate)}</p>
                    </div>
                  </div>
                )}
                
                {stats.completedOrders > 0 && (
                  <div className="activity-item">
                    <span className="activity-icon">✅</span>
                    <div className="activity-content">
                      <p><strong>Completed Orders:</strong> {stats.completedOrders} orders</p>
                    </div>
                  </div>
                )}

                {customer.notes && (
                  <div className="activity-item">
                    <span className="activity-icon">📝</span>
                    <div className="activity-content">
                      <p><strong>Notes:</strong> {customer.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Products */}
              {stats.topProducts.length > 0 && (
                <div className="top-products">
                  <h3>🏆 Most Purchased Products</h3>
                  <div className="products-list">
                    {stats.topProducts.map((product, index) => (
                      <div key={index} className="product-item">
                        <span className="product-rank">#{index + 1}</span>
                        <span className="product-name">{product.name}</span>
                        <span className="product-quantity">{product.quantity} units</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="orders-tab">
              <div className="orders-header">
                <h3>📦 Order History</h3>
                <div className="order-filters">
                  <span className="order-count">{customerOrders.length} orders total</span>
                </div>
              </div>

              {customerOrders.length === 0 ? (
                <div className="no-orders">
                  <p>This customer hasn't placed any orders yet.</p>
                </div>
              ) : (
                <div className="orders-list">
                  {customerOrders
                    .sort((a, b) => new Date(b.order_date) - new Date(a.order_date))
                    .map(order => (
                      <div key={order.id} className="order-item">
                        <div className="order-header">
                          <div className="order-info">
                            <h4>Order #{order.id}</h4>
                            <span className={`status-badge ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="order-meta">
                            <span className="order-date">{formatDate(order.order_date)}</span>
                            <span className="order-total">{formatPrice(order.total)}</span>
                          </div>
                        </div>
                        
                        <div className="order-items">
                          {(orderItems[order.id] || []).length > 0 ? (
                            (orderItems[order.id] || []).map((item, index) => (
                              <div key={item.id || index} className="item-detail">
                                <div className="item-info">
                                  <span className="item-name">{item.product_name || 'Unknown Product'}</span>
                                  <span className="item-meta">
                                    Qty: {item.quantity} × {formatPrice(item.price)} = {formatPrice(parseFloat(item.price) * parseInt(item.quantity))}
                                  </span>
                                </div>
                                <span className="item-total">{formatPrice(parseFloat(item.price) * parseInt(item.quantity))}</span>
                              </div>
                            ))
                          ) : (
                            <div className="no-items">No items found for this order</div>
                          )}
                          
                          {(orderItems[order.id] || []).length > 0 && (
                            <div className="order-summary">
                              <strong>
                                Total: {formatPrice(
                                  (orderItems[order.id] || []).reduce((sum, item) => 
                                    sum + (parseFloat(item.price) * parseInt(item.quantity)), 0
                                  )
                                )}
                              </strong>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-tab">
              <h3>📈 Customer Analytics</h3>
              
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h4>🎯 Customer Behavior</h4>
                  <div className="behavior-stats">
                    <div className="behavior-item">
                      <span className="label">Order Completion Rate:</span>
                      <span className="value">
                        {stats.totalOrders > 0 
                          ? `${Math.round((stats.completedOrders / stats.totalOrders) * 100)}%`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="behavior-item">
                      <span className="label">Average Order Value:</span>
                      <span className="value">{formatPrice(stats.averageOrderValue)}</span>
                    </div>
                    <div className="behavior-item">
                      <span className="label">Customer Since:</span>
                      <span className="value">
                        {customerOrders.length > 0 
                          ? formatDate(Math.min(...customerOrders.map(o => new Date(o.order_date))))
                          : 'No orders yet'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="analytics-card">
                  <h4>💎 Customer Value</h4>
                  <div className="value-breakdown">
                    <div className="value-item">
                      <span className="label">Lifetime Value:</span>
                      <span className="value highlighted">{formatPrice(stats.totalSpent)}</span>
                    </div>
                    <div className="value-item">
                      <span className="label">Pending Value:</span>
                      <span className="value">
                        {formatPrice(
                          customerOrders
                            .filter(order => order.status === 'Pending' || order.status === 'Processing')
                            .reduce((sum, order) => sum + parseFloat(order.total || 0), 0)
                        )}
                      </span>
                    </div>
                    <div className="value-item">
                      <span className="label">Customer Tier:</span>
                      <span className={`tier-badge ${customer.customerTier?.class || 'new'}`}>
                        {customer.customerTier?.icon} {customer.customerTier?.level || 'New'}
                      </span>
                    </div>
                  </div>
                </div>

                {stats.topProducts.length > 0 && (
                  <div className="analytics-card full-width">
                    <h4>📊 Purchase Preferences</h4>
                    <div className="preferences-chart">
                      {stats.topProducts.map((product, index) => {
                        const maxQuantity = Math.max(...stats.topProducts.map(p => p.quantity));
                        const percentage = (product.quantity / maxQuantity) * 100;
                        
                        return (
                          <div key={index} className="preference-bar">
                            <div className="bar-info">
                              <span className="product-name">{product.name}</span>
                              <span className="product-quantity">{product.quantity} units</span>
                            </div>
                            <div className="bar-container">
                              <div 
                                className="bar-fill" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'contact' && (
            <div className="contact-tab">
              <h3>📞 Contact Information</h3>
              
              <div className="contact-grid">
                <div className="contact-section">
                  <h4>👤 Personal Details</h4>
                  <div className="contact-details">
                    <div className="contact-item">
                      <span className="contact-icon">👤</span>
                      <div className="contact-info">
                        <label>Full Name:</label>
                        <span>{customer.name}</span>
                      </div>
                    </div>
                    
                    <div className="contact-item">
                      <span className="contact-icon">📧</span>
                      <div className="contact-info">
                        <label>Email:</label>
                        <a href={`mailto:${customer.email}`} className="contact-link">
                          {customer.email}
                        </a>
                      </div>
                    </div>
                    
                    <div className="contact-item">
                      <span className="contact-icon">📱</span>
                      <div className="contact-info">
                        <label>Phone:</label>
                        <a href={`tel:${customer.phone}`} className="contact-link">
                          {customer.phone}
                        </a>
                      </div>
                    </div>
                    
                    {customer.company && (
                      <div className="contact-item">
                        <span className="contact-icon">🏢</span>
                        <div className="contact-info">
                          <label>Company:</label>
                          <span>{customer.company}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="contact-section">
                  <h4>📍 Address Information</h4>
                  <div className="address-details">
                    <div className="address-item">
                      <span className="contact-icon">📍</span>
                      <div className="address-info">
                        <div className="full-address">
                          {customer.address}
                          {customer.city && <><br/>{customer.city}</>}
                          {customer.state && <>, {customer.state}</>}
                          {customer.postal_code && <> {customer.postal_code}</>}
                        </div>
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(customer.address + ', ' + customer.city + ', Nigeria')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="map-link"
                        >
                          🗺️ View on Map
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {customer.notes && (
                  <div className="contact-section full-width">
                    <h4>📝 Notes</h4>
                    <div className="notes-content">
                      <p>{customer.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h4>⚡ Quick Actions</h4>
                <div className="action-buttons">
                  <a 
                    href={`mailto:${customer.email}`} 
                    className="action-btn email-btn"
                    title="Send Email"
                  >
                    📧 Send Email
                  </a>
                  <a 
                    href={`tel:${customer.phone}`} 
                    className="action-btn phone-btn"
                    title="Call Customer"
                  >
                    📱 Call Customer
                  </a>
                  <a 
                    href={`https://wa.me/${customer.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-btn whatsapp-btn"
                    title="WhatsApp"
                  >
                    💬 WhatsApp
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;