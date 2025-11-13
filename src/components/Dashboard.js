import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiService from '../services/api';
import { formatPrice } from '../utils/priceFormatter';
import SalesChart from './SalesChart';
import '../styles/Dashboard.css';
import '../styles/DashboardCharts.css';

const Dashboard = () => {
  // Dashboard state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalSales: 0,
    completedOrders: 0,
    topProducts: [],
    recentActivity: [],
    monthlyTrend: []
  });

  // Active report view
  const [activeReport, setActiveReport] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔄 Fetching dashboard data...');

      // Use localhost:8000 for consistency with Django server
      const [
        dashboardResponse,
        productsResponse,
        auditLogsResponse
      ] = await Promise.all([
        axios.get('http://localhost:8000/api/dashboard-summary/'),
        axios.get('http://localhost:8000/api/products/'),
        axios.get('http://localhost:8000/api/audit-logs/').catch(() => ({ data: { results: [] } }))
      ]);

      const dashboardSummary = dashboardResponse.data;
      const products = productsResponse.data.results || productsResponse.data;
      const auditLogs = auditLogsResponse.data.results || auditLogsResponse.data;

      console.log('📊 Dashboard Summary:', dashboardSummary);

      // Use accurate data from backend
      const { summary, top_products, order_status } = dashboardSummary;

      // Prepare chart data with real backend data
      const chartData = {
        // Sales trend data (mock for now - you can create an endpoint for this)
        salesTrend: [
          { period: 'Mon', revenue: summary.total_sales * 0.1, orders: Math.floor(summary.completed_orders * 0.1) },
          { period: 'Tue', revenue: summary.total_sales * 0.15, orders: Math.floor(summary.completed_orders * 0.15) },
          { period: 'Wed', revenue: summary.total_sales * 0.12, orders: Math.floor(summary.completed_orders * 0.12) },
          { period: 'Thu', revenue: summary.total_sales * 0.18, orders: Math.floor(summary.completed_orders * 0.18) },
          { period: 'Fri', revenue: summary.total_sales * 0.2, orders: Math.floor(summary.completed_orders * 0.2) },
          { period: 'Sat', revenue: summary.total_sales * 0.15, orders: Math.floor(summary.completed_orders * 0.15) },
          { period: 'Sun', revenue: summary.total_sales * 0.1, orders: Math.floor(summary.completed_orders * 0.1) }
        ],

        // Top products chart data from backend
        topProductsChart: top_products.map(product => ({
          name: product.product__name?.substring(0, 15) + '...' || 'Unknown',
          revenue: product.total_revenue || 0,
          quantity: product.total_quantity || 0
        })),

        // Stock status pie chart data using real product data
        stockStatus: [
          { 
            name: 'High Stock', 
            value: products.filter(p => p.quantity > 50).length 
          },
          { 
            name: 'Normal Stock', 
            value: products.filter(p => p.quantity > 10 && p.quantity <= 50).length 
          },
          { 
            name: 'Low Stock', 
            value: products.filter(p => p.quantity > 0 && p.quantity <= 10).length 
          },
          { 
            name: 'Out of Stock', 
            value: products.filter(p => p.quantity === 0).length 
          }
        ].filter(item => item.value > 0),

        // Order status chart data from backend
        orderStatus: order_status.map(status => ({
          status: status.status,
          count: status.count,
          revenue: status.total_value || 0
        }))
      };

      console.log('💰 Accurate totals from backend:', {
        totalSales: summary.total_sales,
        completedOrders: summary.completed_orders,
        lowStock: summary.low_stock_count,
        totalProducts: summary.total_products
      });

      setDashboardData({
        totalProducts: summary.total_products,
        lowStockCount: summary.low_stock_count,
        totalSales: summary.total_sales,
        completedOrders: summary.completed_orders,
        topProducts: top_products.map(p => ({
          product__name: p.product__name,
          total_quantity_sold: p.total_quantity,
          total_revenue: p.total_revenue
        })),
        recentActivity: auditLogs.slice(0, 10),
        chartData: chartData,
        summary: summary,
        products: products  // Add products for inventory tab
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { status: 'Out of Stock', class: 'out-stock', icon: '❌' };
    if (product.quantity <= (product.low_stock_threshold || 10)) return { status: 'Low Stock', class: 'low-stock', icon: '⚠️' };
    if (product.quantity <= 50) return { status: 'Normal', class: 'normal-stock', icon: '✅' };
    return { status: 'High Stock', class: 'high-stock', icon: '📈' };
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-dashboard">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-dashboard">
          <h3>Dashboard Error</h3>
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="retry-btn">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>📊 Inventory Dashboard</h1>
        <div className="dashboard-nav">
          <button 
            className={activeReport === 'overview' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveReport('overview')}
          >
            📈 Overview
          </button>
          <button 
            className={activeReport === 'inventory' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveReport('inventory')}
          >
            📦 Inventory
          </button>
          <button 
            className={activeReport === 'sales' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveReport('sales')}
          >
            💰 Sales
          </button>
          <button 
            className={activeReport === 'activity' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setActiveReport('activity')}
          >
            📋 Activity
          </button>
        </div>
      </div>

      {/* Overview Dashboard */}
      {activeReport === 'overview' && (
        <div className="dashboard-content">
          {/* Key Metrics Cards */}
          <div className="metrics-grid">
            <div className="metric-card products">
              <div className="metric-icon">📦</div>
              <div className="metric-info">
                <h3>{dashboardData.totalProducts}</h3>
                <p>Total Products</p>
              </div>
            </div>

            <div className="metric-card low-stock">
              <div className="metric-icon">⚠️</div>
              <div className="metric-info">
                <h3>{dashboardData.lowStockCount}</h3>
                <p>Low Stock Items</p>
              </div>
            </div>

            <div className="metric-card sales">
              <div className="metric-icon">💰</div>
              <div className="metric-info">
                <h3>{formatPrice(dashboardData.totalSales)}</h3>
                <p>Total Sales</p>
              </div>
            </div>

            <div className="metric-card orders">
              <div className="metric-icon">📋</div>
              <div className="metric-info">
                <h3>{dashboardData.completedOrders}</h3>
                <p>Completed Orders</p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            <div className="chart-card">
              <SalesChart 
                chartType="salesTrend" 
                data={dashboardData.chartData?.salesTrend || []}
                title="📈 Sales Trend (This Week)"
              />
            </div>
            <div className="chart-card">
              <SalesChart 
                chartType="stockStatus" 
                data={dashboardData.chartData?.stockStatus || []}
                title="📦 Stock Status Distribution"
              />
            </div>
          </div>

          {/* Top Products and Recent Activity */}
          <div className="dashboard-sections">
            <div className="top-products-section">
              <h2>🏆 Top Selling Products</h2>
              <div className="top-products-list">
                {dashboardData.topProducts.length > 0 ? (
                  dashboardData.topProducts.map((product, index) => (
                    <div key={index} className="top-product-item">
                      <div className="product-rank">#{index + 1}</div>
                      <div className="product-info">
                        <h4>{product.product__name}</h4>
                        <p>Sold: {product.total_quantity_sold || 0} units</p>
                        <p>Revenue: {formatPrice(product.total_revenue || 0)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No sales data available</p>
                )}
              </div>
            </div>

            <div className="recent-activity-section">
              <h2>📊 Recent Activity</h2>
              <div className="activity-list">
                {dashboardData.recentActivity.length > 0 ? (
                  dashboardData.recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">📋</div>
                      <div className="activity-info">
                        <p>{activity.action}</p>
                        <small>{formatDate(activity.log_time)}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inventory Report */}
      {activeReport === 'inventory' && (
        <div className="dashboard-content">
          <div className="inventory-overview">
            <h2>📦 Inventory Overview</h2>
            
            <div className="inventory-stats">
              <div className="stat-card">
                <h3>Stock Status Distribution</h3>
                <div className="status-grid">
                  {dashboardData.products && (() => {
                    const statusCounts = dashboardData.products.reduce((acc, product) => {
                      const status = getStockStatus(product);
                      acc[status.status] = (acc[status.status] || 0) + 1;
                      return acc;
                    }, {});
                    
                    return Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="status-item">
                        <span className="status-count">{count}</span>
                        <span className="status-label">{status}</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              <div className="stat-card">
                <h3>💰 Total Inventory Value</h3>
                <div className="inventory-value">
                  {formatPrice(dashboardData.summary?.total_inventory_value || 0)}
                </div>
              </div>
            </div>

            <div className="products-table-container">
              <h3>📋 Product Stock Details</h3>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Stock</th>
                    <th>Price</th>
                    <th>Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.products?.map(product => {
                    const status = getStockStatus(product);
                    return (
                      <tr key={product.id} className={status.class}>
                        <td>{product.name}</td>
                        <td>{product.quantity.toLocaleString()}</td>
                        <td>{formatPrice(product.price)}</td>
                        <td>{formatPrice(product.price * product.quantity)}</td>
                        <td>
                          <span className={`status-badge ${status.class}`}>
                            {status.icon} {status.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sales Report */}
      {activeReport === 'sales' && (
        <div className="dashboard-content">
          <div className="sales-overview">
            <h2>💰 Sales Analytics</h2>
            
            <div className="sales-metrics">
              <div className="metric-card">
                <h3>Total Revenue</h3>
                <div className="metric-value">{formatPrice(dashboardData.totalSales)}</div>
              </div>
              <div className="metric-card">
                <h3>Completed Orders</h3>
                <div className="metric-value">{dashboardData.completedOrders}</div>
              </div>
              <div className="metric-card">
                <h3>Average Order Value</h3>
                <div className="metric-value">
                  {formatPrice(dashboardData.summary?.average_order_value || 0)}
                </div>
              </div>
            </div>

            {/* Enhanced Charts for Sales */}
            <div className="charts-grid">
              <div className="chart-card">
                <SalesChart 
                  chartType="topProducts" 
                  data={dashboardData.chartData?.topProductsChart || []}
                  title="🏆 Top Products Performance"
                />
              </div>
              <div className="chart-card">
                <SalesChart 
                  chartType="orderStatus" 
                  data={dashboardData.chartData?.orderStatus || []}
                  title="📋 Orders by Status"
                />
              </div>
            </div>

            <div className="top-products-detailed">
              <h3>🏆 Best Performing Products</h3>
              <div className="products-performance">
                {dashboardData.topProducts.map((product, index) => (
                  <div key={index} className="performance-card">
                    <div className="rank">#{index + 1}</div>
                    <div className="product-details">
                      <h4>{product.product__name}</h4>
                      <div className="performance-stats">
                        <span>Units Sold: {product.total_quantity_sold || 0}</span>
                        <span>Revenue: {formatPrice(product.total_revenue || 0)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Report */}
      {activeReport === 'activity' && (
        <div className="dashboard-content">
          <div className="activity-overview">
            <h2>📋 System Activity Log</h2>
            
            <div className="activity-timeline">
              {dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker">📋</div>
                  <div className="timeline-content">
                    <div className="activity-action">{activity.action}</div>
                    <div className="activity-meta">
                      <span>👤 {activity.user}</span>
                      <span>🕒 {formatDate(activity.log_time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="dashboard-footer">
        <button onClick={fetchDashboardData} className="refresh-btn">
          🔄 Refresh Dashboard
        </button>
      </div>
    </div>
  );
};

export default Dashboard;