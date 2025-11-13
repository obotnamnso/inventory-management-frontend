import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import AddProductForm from './AddProductForm';
import EditProductForm from './EditProductForm';
import DeleteConfirmation from './DeleteConfirmation';
import StockHistory from './StockHistory';
import { formatPrice } from '../utils/priceFormatter';
import './ProductList.css';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockFilter, setStockFilter] = useState('all'); // all, low, normal, high
  const [sortBy, setSortBy] = useState('name'); // name, price, quantity
  
  // Add product states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [stockHistoryProduct, setStockHistoryProduct] = useState(null);
  const [userRole] = useState('manager'); // This would come from authentication context

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await apiService.products.getAll();
      const productData = response.data.results || response.data;
      setProducts(productData);
      setFilteredProducts(productData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products: ' + err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  useEffect(() => {
    let filtered = [...products];

    // Search by name or description
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by price range
    if (priceRange.min) {
      filtered = filtered.filter(product => 
        parseFloat(product.price) >= parseFloat(priceRange.min)
      );
    }
    if (priceRange.max) {
      filtered = filtered.filter(product => 
        parseFloat(product.price) <= parseFloat(priceRange.max)
      );
    }

    // Filter by stock level
    if (stockFilter === 'low') {
      filtered = filtered.filter(product => product.is_low_stock);
    } else if (stockFilter === 'normal') {
      filtered = filtered.filter(product => 
        !product.is_low_stock && product.quantity <= 200
      );
    } else if (stockFilter === 'high') {
      filtered = filtered.filter(product => product.quantity > 200);
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'quantity':
          return a.quantity - b.quantity;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredProducts(filtered);
  }, [products, searchTerm, priceRange, stockFilter, sortBy]);

  const clearFilters = () => {
    setSearchTerm('');
    setPriceRange({ min: '', max: '' });
    setStockFilter('all');
    setSortBy('name');
  };

  const handleProductAdded = (newProduct) => {
    // Add the new product to the list
    setProducts(prevProducts => [...prevProducts, newProduct]);
    setShowAddForm(false);
    // Refresh the products list to get the latest data
    fetchProducts();
  };

  const handleCancelAddProduct = () => {
    setShowAddForm(false);
  };

  // Edit product handlers
  const handleEditProduct = (product) => {
    setEditProduct(product);
  };

  const handleCancelEdit = () => {
    setEditProduct(null);
  };

  const handleProductUpdated = (updatedProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    setEditProduct(null);
    fetchProducts(); // Refresh to get latest data
  };

  // Delete product handlers
  const handleDeleteProduct = (product) => {
    setDeleteProduct(product);
  };

  const handleCancelDelete = () => {
    setDeleteProduct(null);
  };

  const handleProductDeleted = (deletedProductId) => {
    setProducts(products.filter(p => p.id !== deletedProductId));
    setDeleteProduct(null);
  };

  // Stock history handlers
  const handleShowStockHistory = (product) => {
    setStockHistoryProduct(product);
  };

  const handleCloseStockHistory = () => {
    setStockHistoryProduct(null);
  };



  if (loading) {
    return (
      <div className="product-list-container">
        <h2>Products</h2>
        <div className="loading">Loading products...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-list-container">
        <h2>Products</h2>
        <div className="error">{error}</div>
        <button onClick={fetchProducts}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="page-header">
        <h2>Inventory Products</h2>
        {(userRole === 'manager' || userRole === 'sales') && !showAddForm && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="add-product-btn"
          >
            ➕ Add New Product
          </button>
        )}
      </div>

      {/* Add Product Form */}
      {showAddForm && (
        <AddProductForm 
          onProductAdded={handleProductAdded}
          onCancel={handleCancelAddProduct}
          userRole={userRole}
        />
      )}
      
      {/* Search and Filter Controls */}
      <div className="filters-section">
        <div className="search-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-controls">
            <div className="price-range">
              <label>Price Range (₦):</label>
              <div>
                <input
                  type="number"
                  placeholder="Min ₦"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                  className="price-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max ₦"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                  className="price-input"
                />
              </div>
              {(priceRange.min || priceRange.max) && (
                <div className="price-range-preview">
                  {priceRange.min && formatPrice(priceRange.min)} 
                  {priceRange.min && priceRange.max && ' - '}
                  {priceRange.max && formatPrice(priceRange.max)}
                </div>
              )}
            </div>

            <div className="stock-filter">
              <label>Stock Level:</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="normal">Normal Stock</option>
                <option value="high">High Stock</option>
              </select>
            </div>

            <div className="sort-control">
              <label>Sort By:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="quantity">Stock Quantity</option>
              </select>
            </div>

            <button onClick={clearFilters} className="clear-filters-btn">
              Clear Filters
            </button>
          </div>
        </div>
        
        <div className="results-info">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="no-products">
          {products.length === 0 ? (
            <>
              <p>No products found in inventory.</p>
              <p>Add some products through your Django admin or API.</p>
            </>
          ) : (
            <p>No products match your search criteria. Try adjusting your filters.</p>
          )}
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-header">
                <h3>{product.name}</h3>
                <div className="product-actions">
                  <button 
                    className="action-btn stock-history-btn"
                    onClick={() => handleShowStockHistory(product)}
                    title="View stock movement history"
                  >
                    📊
                  </button>
                  <button 
                    className="action-btn edit-btn"
                    onClick={() => handleEditProduct(product)}
                    disabled={userRole === 'viewer'}
                    title="Edit product"
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteProduct(product)}
                    disabled={userRole !== 'manager'}
                    title="Delete product"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className="product-description">{product.description}</p>
              <div className="product-details">
                <span className="product-price">{formatPrice(product.price)}</span>
                <span className={`product-quantity ${product.is_low_stock ? 'low-stock' : ''}`}>
                  Stock: {product.quantity.toLocaleString('en-US')}
                  {product.is_low_stock && <span className="low-stock-warning"> (Low Stock!)</span>}
                </span>
              </div>
              <div className="product-meta">
                <small>Added: {new Date(product.created_at).toLocaleDateString()}</small>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="product-actions">
        <button onClick={fetchProducts} className="refresh-button">
          Refresh Products
        </button>
      </div>

      {/* Modal Components */}
      {editProduct && (
        <EditProductForm 
          product={editProduct}
          onCancel={handleCancelEdit}
          onUpdate={handleProductUpdated}
          userRole={userRole}
        />
      )}

      {deleteProduct && (
        <DeleteConfirmation 
          product={deleteProduct}
          onCancel={handleCancelDelete}
          onDelete={handleProductDeleted}
          userRole={userRole}
        />
      )}

      {stockHistoryProduct && (
        <StockHistory 
          productId={stockHistoryProduct.id}
          onClose={handleCloseStockHistory}
        />
      )}
    </div>
  );
};

export default ProductList;