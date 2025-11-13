// API service for Django backend integration
import axios from 'axios';

// Base URL for your Django API
const BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Enable credentials for authentication
  withCredentials: true,
});

// API endpoints object
const apiService = {
  // Products API
  products: {
    // Get all products
    getAll: () => api.get('/products/'),
    
    // Get single product by ID
    getById: (id) => api.get(`/products/${id}/`),
    
    // Create new product
    create: (productData) => api.post('/products/', productData),
    
    // Update existing product
    update: (id, productData) => api.put(`/products/${id}/`, productData),
    
    // Delete product
    delete: (id) => api.delete(`/products/${id}/`),
  },

  // Customers API
  customers: {
    getAll: () => api.get('/customers/'),
    getById: (id) => api.get(`/customers/${id}/`),
    create: (customerData) => api.post('/customers/', customerData),
    update: (id, customerData) => api.put(`/customers/${id}/`, customerData),
    delete: (id) => api.delete(`/customers/${id}/`),
  },

  // Orders API
  orders: {
    getAll: () => api.get('/orders/'),
    getById: (id) => api.get(`/orders/${id}/`),
    create: (orderData) => api.post('/orders/', orderData),
    update: (id, orderData) => api.put(`/orders/${id}/`, orderData),
    delete: (id) => api.delete(`/orders/${id}/`),
  },

  // Order Items API
  orderItems: {
    getAll: () => api.get('/order-items/'),
    getById: (id) => api.get(`/order-items/${id}/`),
    create: (itemData) => api.post('/order-items/', itemData),
    update: (id, itemData) => api.put(`/order-items/${id}/`, itemData),
    delete: (id) => api.delete(`/order-items/${id}/`),
  },

  // Reports API
  reports: {
    lowStock: () => api.get('/reports/low-stock/'),
    salesSummary: () => api.get('/reports/sales-summary/'),
    topSellingProducts: () => api.get('/reports/top-selling-products/'),
    customerPurchaseHistory: () => api.get('/reports/customer-purchase-history/'),
    monthlySalesTrend: () => api.get('/reports/monthly-sales-trend/'),
    discountsGiven: () => api.get('/reports/discounts-given/'),
    inactiveCustomers: () => api.get('/reports/inactive-customers/'),
    orderStatusBreakdown: () => api.get('/reports/order-status-breakdown/'),
  },
};

// Add request interceptor for authentication (if needed later)
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('authToken');
      // Redirect to login if needed
    }
    return Promise.reject(error);
  }
);

export default apiService;