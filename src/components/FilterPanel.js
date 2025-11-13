import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '../styles/FilterPanel.css';

const FilterPanel = ({ 
  filters, 
  onFiltersChange, 
  customers, 
  onClearFilters,
  totalResults,
  isVisible,
  onToggleVisibility 
}) => {
  // Local state for filter inputs
  const [localFilters, setLocalFilters] = useState({
    search: '',
    status: '',
    customer: '',
    dateFrom: null,
    dateTo: null,
    amountMin: '',
    amountMax: '',
    orderBy: 'date_desc'
  });

  // Sync local filters with parent filters
  useEffect(() => {
    setLocalFilters(prev => ({ ...prev, ...filters }));
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Handle date range changes
  const handleDateChange = (date, type) => {
    const newFilters = { 
      ...localFilters, 
      [type]: date 
    };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  // Clear all filters
  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: '',
      customer: '',
      dateFrom: null,
      dateTo: null,
      amountMin: '',
      amountMax: '',
      orderBy: 'date_desc'
    };
    setLocalFilters(clearedFilters);
    onClearFilters();
  };

  // Count active filters
  const activeFiltersCount = Object.values(localFilters).filter(value => 
    value !== '' && value !== null && value !== 'date_desc'
  ).length;

  return (
    <div className={`filter-panel ${isVisible ? 'visible' : 'collapsed'}`}>
      {/* Filter Header */}
      <div className="filter-header">
        <div className="filter-title">
          <h3>🔍 Advanced Filters</h3>
          <button 
            className="toggle-filters-btn"
            onClick={onToggleVisibility}
            title={isVisible ? 'Hide Filters' : 'Show Filters'}
          >
            {isVisible ? '▲' : '▼'}
          </button>
        </div>
        
        {isVisible && (
          <div className="filter-summary">
            <span className="results-count">
              📊 {totalResults} results found
            </span>
            {activeFiltersCount > 0 && (
              <span className="active-filters">
                🎯 {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filter Controls */}
      {isVisible && (
        <div className="filter-controls">
          {/* Search Bar */}
          <div className="filter-row">
            <div className="filter-group search-group">
              <label>🔍 Global Search</label>
              <input
                type="text"
                placeholder="Search orders, customers, products..."
                value={localFilters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Status and Customer Filters */}
          <div className="filter-row">
            <div className="filter-group">
              <label>📋 Order Status</label>
              <select
                value={localFilters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-group">
              <label>👤 Customer</label>
              <select
                value={localFilters.customer}
                onChange={(e) => handleFilterChange('customer', e.target.value)}
                className="filter-select"
              >
                <option value="">All Customers</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>📊 Sort By</label>
              <select
                value={localFilters.orderBy}
                onChange={(e) => handleFilterChange('orderBy', e.target.value)}
                className="filter-select"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="customer_asc">Customer A-Z</option>
                <option value="status_asc">Status A-Z</option>
              </select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="filter-row">
            <div className="filter-group">
              <label>📅 Date From</label>
              <DatePicker
                selected={localFilters.dateFrom}
                onChange={(date) => handleDateChange(date, 'dateFrom')}
                selectsStart
                startDate={localFilters.dateFrom}
                endDate={localFilters.dateTo}
                placeholderText="Select start date"
                className="date-picker"
                dateFormat="MMM dd, yyyy"
                isClearable
              />
            </div>

            <div className="filter-group">
              <label>📅 Date To</label>
              <DatePicker
                selected={localFilters.dateTo}
                onChange={(date) => handleDateChange(date, 'dateTo')}
                selectsEnd
                startDate={localFilters.dateFrom}
                endDate={localFilters.dateTo}
                minDate={localFilters.dateFrom}
                placeholderText="Select end date"
                className="date-picker"
                dateFormat="MMM dd, yyyy"
                isClearable
              />
            </div>
          </div>

          {/* Amount Range Filters */}
          <div className="filter-row">
            <div className="filter-group">
              <label>💰 Min Amount (₦)</label>
              <input
                type="number"
                placeholder="0"
                value={localFilters.amountMin}
                onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                className="amount-input"
                min="0"
                step="0.01"
              />
            </div>

            <div className="filter-group">
              <label>💰 Max Amount (₦)</label>
              <input
                type="number"
                placeholder="No limit"
                value={localFilters.amountMax}
                onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                className="amount-input"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="filter-actions">
            <button 
              onClick={handleClearFilters}
              className="clear-filters-btn"
              disabled={activeFiltersCount === 0}
            >
              🗑️ Clear All Filters
            </button>
            
            <div className="quick-filters">
              <button 
                onClick={() => handleFilterChange('status', 'Pending')}
                className="quick-filter-btn"
              >
                ⏳ Pending Orders
              </button>
              <button 
                onClick={() => {
                  const today = new Date();
                  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                  handleDateChange(weekAgo, 'dateFrom');
                  handleDateChange(today, 'dateTo');
                }}
                className="quick-filter-btn"
              >
                📅 Last 7 Days
              </button>
              <button 
                onClick={() => {
                  handleFilterChange('amountMin', '10000');
                }}
                className="quick-filter-btn"
              >
                💰 High Value (₦10k+)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;