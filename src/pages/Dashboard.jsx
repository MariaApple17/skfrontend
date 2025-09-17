import React from 'react';
import BudgetByProjectChart from '../components/Charts/BudgetByProjectChart';

export default function Dashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      
      <aside style={{
        width: 220,
        background: '#1f2937',
        color: '#fff',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>SK360</h1>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</a>
          <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Projects</a>
          <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Budgets</a>
          <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Users</a>
          <a href="#" style={{ color: '#fff', textDecoration: 'none' }}>Reports</a>
        </nav>
      </aside>

      <main style={{ flex: 1, background: '#f3f4f6', padding: '30px' }}>
        
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dashboard</h2>
          <div>
            <button style={{
              padding: '8px 15px',
              background: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}>Settings</button>
          </div>
        </header>

        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 200px',
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <h3>Total Projects</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>12</p>
          </div>
          <div style={{
            flex: '1 1 200px',
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <h3>Active Users</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>34</p>
          </div>
          <div style={{
            flex: '1 1 200px',
            background: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}>
            <h3>Total Budget</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold' }}>$120,000</p>
          </div>
        </div>

        <section style={{
          background: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '20px' }}>Budget by Project</h3>
          <BudgetByProjectChart />
        </section>

      </main>
    </div>
  );
}
