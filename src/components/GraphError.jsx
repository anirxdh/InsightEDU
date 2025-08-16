import React from 'react';

export default function GraphError({ message = "Graph failed to load" }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      color: '#a1a1aa',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ fontSize: '16px', marginBottom: '8px' }}>
        {message}
      </div>
      <div style={{ fontSize: '14px', color: '#71717a' }}>
        Refresh the page to get graph
      </div>
    </div>
  );
}
