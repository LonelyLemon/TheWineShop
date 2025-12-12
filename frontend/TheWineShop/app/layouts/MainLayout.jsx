import React from 'react';
import Navbar from '../components/Navbar';
import { Outlet } from 'react-router-dom';

const MainLayout = () => {
  return (
    <>
      <Navbar />
      <main style={{ minHeight: '80vh', backgroundColor: '#f9f9f9' }}>
        <Outlet /> 
      </main>
      
      <footer style={{ background: '#333', color: '#fff', padding: '20px', textAlign: 'center' }}>
        <p>&copy; 2025 TheWineShop. All rights reserved.</p>
      </footer>
    </>
  );
};

export default MainLayout;