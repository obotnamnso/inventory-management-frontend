import React, { useState } from 'react';
import ProductList from './components/ProductList';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import OrderList from './components/OrderList';
import ConnectionTest from './components/ConnectionTest';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>🏢 Inventory Management System</h1>
          <p>Professional inventory solution with real-time analytics</p>
        </div>
        
        <nav className="main-navigation">
          <button 
            className={currentView === 'dashboard' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={currentView === 'products' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('products')}
          >
            📦 Products
          </button>
          <button 
            className={currentView === 'customers' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('customers')}
          >
            👥 Customers
          </button>
          <button 
            className={currentView === 'orders' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('orders')}
          >
            📋 Orders
          </button>
          <button 
            className={currentView === 'test' ? 'nav-btn active' : 'nav-btn'}
            onClick={() => setCurrentView('test')}
          >
            🔗 API Test
          </button>
        </nav>
      </header>

      <main className="main-content">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'products' && <ProductList />}
        {currentView === 'customers' && <CustomerList />}
        {currentView === 'orders' && <OrderList />}
        {currentView === 'test' && <ConnectionTest />}
      </main>
    </div>
  );
}

export default App;
