import React from 'react';

export default function Footer() {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '10px 0',
        background: '#2c3e50',
        color: 'white',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <p>© 2025 Customer Insights. All rights reserved.</p>
    </div>
  );
}
