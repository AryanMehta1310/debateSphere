import React from 'react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '2rem 0' }}>
      <div className="spinner"></div>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{text}</span>
    </div>
  );
};

export default LoadingSpinner;
