import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConnectionTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    testConnections();
  }, []);

  const testConnections = async () => {
    setLoading(true);
    const results = {};
    const errorLog = {};

    // Test all major API endpoints
    const endpoints = [
      { name: 'Products', url: 'http://localhost:8000/api/products/' },
      { name: 'Customers', url: 'http://localhost:8000/api/customers/' },
      { name: 'Orders', url: 'http://localhost:8000/api/orders/' },
      { name: 'Dashboard', url: 'http://localhost:8000/api/dashboard-summary/' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔄 Testing ${endpoint.name}...`);
        const response = await axios.get(endpoint.url);
        results[endpoint.name] = {
          status: 'SUCCESS',
          statusCode: response.status,
          dataCount: response.data.count || response.data.summary ? 'Dashboard Data' : 'Unknown',
          message: 'Connection successful'
        };
        console.log(`✅ ${endpoint.name}: OK`);
      } catch (error) {
        errorLog[endpoint.name] = error.message;
        results[endpoint.name] = {
          status: 'ERROR',
          statusCode: error.response?.status || 'No Response',
          message: error.message,
          details: error.response?.data || 'Network error'
        };
        console.error(`❌ ${endpoint.name}:`, error.message);
      }
    }

    setTestResults(results);
    setErrors(errorLog);
    setLoading(false);
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#f5f5f5', border: '1px solid #ddd', margin: '20px' }}>
        <h3>🔄 Testing API Connections...</h3>
        <p>Please wait while we test the connection between React and Django...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f9f9f9', border: '2px solid #007bff', margin: '20px' }}>
      <h2>🔗 API Connection Test Results</h2>
      
      {Object.entries(testResults).map(([name, result]) => (
        <div key={name} style={{ 
          padding: '10px', 
          margin: '10px 0', 
          border: '1px solid #ccc',
          backgroundColor: result.status === 'SUCCESS' ? '#d4edda' : '#f8d7da',
          borderColor: result.status === 'SUCCESS' ? '#c3e6cb' : '#f5c6cb'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>
            {result.status === 'SUCCESS' ? '✅' : '❌'} {name} API
          </h4>
          <p><strong>Status:</strong> {result.status}</p>
          <p><strong>HTTP Code:</strong> {result.statusCode}</p>
          <p><strong>Message:</strong> {result.message}</p>
          {result.dataCount && <p><strong>Data:</strong> {result.dataCount} items</p>}
          {result.details && (
            <details>
              <summary>Error Details</summary>
              <pre style={{ fontSize: '12px', color: '#721c24' }}>
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </details>
          )}
        </div>
      ))}

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#d1ecf1', border: '1px solid #bee5eb' }}>
        <h4>📊 Connection Summary</h4>
        <p>
          <strong>Success:</strong> {Object.values(testResults).filter(r => r.status === 'SUCCESS').length} / {Object.keys(testResults).length} endpoints
        </p>
        <p><strong>Django Server:</strong> http://localhost:8000</p>
        <p><strong>React Client:</strong> http://localhost:3000</p>
      </div>

      <button 
        onClick={testConnections}
        style={{
          marginTop: '10px',
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        🔄 Retest Connections
      </button>
    </div>
  );
};

export default ConnectionTest;