import React, { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axiosClient from '../api/axiosClient';
import ChatBot from '../components/ChatBot';

const MainLayout = () => {
  const [userRole, setUserRole] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserRole = async () => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const res = await axiosClient.get('/api/users/me');
                setUserRole(res.data.role);
            } catch (e) {
                console.log(e);
            }
        }
    };
    fetchUserRole();
  }, [location.pathname]);

  const isAdminOrStock = ['admin', 'stock_manager'].includes(userRole);
  const isAdminOnly = userRole === 'admin';

  return (
    <div className="main-layout">
      <Navbar />
      
      <div className="content-wrapper" style={{display: 'flex', minHeight: '100vh', marginTop: '60px'}}>
        {isAdminOrStock && location.pathname.startsWith('/admin') && (
            <aside style={{width: '250px', background: '#001529', color: 'white', padding: '20px'}}>
                <h3 style={{borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px'}}>
                    {userRole === 'admin' ? 'Admin Panel' : 'Stock Manager'}
                </h3>
                <nav style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                    <Link to="/admin/dashboard" className="admin-link">📊 Tổng quan (Dashboard)</Link>
                    <Link to="/admin/orders" className="admin-link">📦 Quản lý Đơn hàng</Link>
                    <Link to="/admin/products" className="admin-link">🍷 Quản lý Sản phẩm</Link>
                    
                    <Link to="/admin/inventory" className="admin-link">🏭 Kho hàng (Inventory)</Link>

                    {isAdminOnly && (
                      <>
                        <Link to="/admin/promotions" className="admin-link">🎟️ Khuyến mãi (Promotions)</Link>
                        <Link to="/admin/users" className="admin-link">👥 Quản lý Người dùng</Link>
                      </>
                    )}
                </nav>
            </aside>
        )}

        <main style={{flex: 1, padding: '20px', background: '#f0f2f5'}}>
          <Outlet />
        </main>
        <ChatBot />
      </div>
    </div>
  );
};

export default MainLayout;