import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { formatPrice } from '../utils/priceFormatter';
import '../styles/CustomerList.css';

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Fetching customer data...');

      // Function to fetch all pages of data
      const fetchAllPages = async (baseUrl) => {
        let allData = [];
        let nextUrl = baseUrl;
        
        while (nextUrl) {
          const response = await axios.get(nextUrl);
          const data = response.data.results || response.data;
          allData = allData.concat(data);
          nextUrl = response.data.next; // Get next page URL
        }
        
        return allData;
      };

      // Fetch all pages of data
      const [customersData, ordersData, orderItemsData] = await Promise.all([
        fetchAllPages('http://localhost:8000/api/customers/'),
        fetchAllPages('http://localhost:8000/api/orders/'),
        fetchAllPages('http://localhost:8000/api/order-items/')
      ]);

      console.log('📊 Raw Data (All Pages):', {
        customers: customersData.length,
        orders: ordersData.length,
        orderItems: orderItemsData.length
      });

      // Calculate customer stats
      const enrichedCustomers = customersData.map(customer => {
        console.log(`\n👤 Processing customer: ${customer.name} (ID: ${customer.id})`);
        
        // Find customer's orders - API now returns customer_id instead of customer name
        const customerOrders = ordersData.filter(order => order.customer_id === customer.id);
        console.log(`  📦 Found ${customerOrders.length} orders for ${customer.name} (ID: ${customer.id})`);
        
        // Calculate total spent from ALL orders (both completed and pending)
        let totalSpent = 0;
        let orderCount = 0;

        customerOrders.forEach(order => {
          console.log(`    🛒 Order ${order.id}: ${order.status}`);
          
          const orderItems = orderItemsData.filter(item => item.order === order.id);
          console.log(`      📋 ${orderItems.length} items in this order`);
          
          orderItems.forEach(item => {
            const itemPrice = parseFloat(item.price) || 0;
            const itemQuantity = parseInt(item.quantity) || 0;
            const itemTotal = itemPrice * itemQuantity;
            
            totalSpent += itemTotal;
            
            console.log(`        🧾 Item: ₦${itemPrice} × ${itemQuantity} = ₦${itemTotal.toFixed(2)}`);
          });
          
          orderCount++;
        });

        console.log(`  💰 Total spent: ₦${totalSpent.toFixed(2)}`);
        console.log(`  📊 Total orders: ${orderCount}`);

        return {
          ...customer,
          totalSpent: totalSpent,
          totalOrders: orderCount,
          tier: getTierLevel(totalSpent)
        };
      });

      console.log('✅ Enriched customers:', enrichedCustomers);
      setCustomers(enrichedCustomers);

    } catch (error) {
      console.error('❌ Error fetching customers:', error);
      setError('Failed to load customers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTierLevel = (totalSpent) => {
    if (totalSpent >= 10000000) return { level: 'Gold', class: 'gold', icon: '👑' };
    if (totalSpent >= 5000000) return { level: 'Silver', class: 'silver', icon: '🥈' };
    if (totalSpent >= 1000000) return { level: 'Bronze', class: 'bronze', icon: '🥉' };
    if (totalSpent > 0) return { level: 'Active', class: 'active', icon: '🌟' };
    return { level: 'New', class: 'new', icon: '👤' };
  };

  if (loading) {
    return (
      <div className="customer-list-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <h3>Loading customers...</h3>
          <p>Please wait while we fetch the data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="customer-list-container">
        <div className="error-state">
          <h3>❌ Error Loading Customers</h3>
          <p>{error}</p>
          <button onClick={fetchCustomers} className="retry-btn">
            🔄 Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-list-container">
      {/* Header */}
      <div className="page-header">
        <h1>👥 Customer Management</h1>
        <button onClick={fetchCustomers} className="refresh-btn">
          🔄 Refresh Data
        </button>
      </div>

      {/* Quick Stats */}
      <div className="customer-stats">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{customers.length}</h3>
            <p>Total Customers</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">�</div>
          <div className="stat-info">
            <h3>{formatPrice(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🌟</div>
          <div className="stat-info">
            <h3>{customers.filter(c => c.totalSpent > 0).length}</h3>
            <p>Active Customers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">�</div>
          <div className="stat-info">
            <h3>{customers.filter(c => c.tier.level === 'Gold').length}</h3>
            <p>Gold Customers</p>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="customers-section">
        <h2>Customer List</h2>
        
        {customers.length === 0 ? (
          <div className="no-customers">
            <h3>No customers found</h3>
            <p>Add some customers to get started</p>
          </div>
        ) : (
          <div className="customers-table-container">
            <table className="customers-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Tier</th>
                  <th>Orders</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(customer => (
                  <tr key={customer.id}>
                    <td>
                      <div className="customer-info">
                        <strong>{customer.name}</strong>
                        <small>{customer.address || 'No address'}</small>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <div>📧 {customer.email}</div>
                        <div>📱 {customer.phone}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`tier-badge ${customer.tier.class}`}>
                        {customer.tier.icon} {customer.tier.level}
                      </span>
                    </td>
                    <td>
                      <strong>{customer.totalOrders}</strong>
                    </td>
                    <td className="amount">
                      <strong>{formatPrice(customer.totalSpent)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="debug-info" style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', fontSize: '12px' }}>
        <strong>Debug Info:</strong>
        <p>Customers loaded: {customers.length}</p>
        <p>Total revenue: {formatPrice(customers.reduce((sum, c) => sum + c.totalSpent, 0))}</p>
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  );
};

export default CustomerList;