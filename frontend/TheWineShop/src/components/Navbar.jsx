import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await axiosClient.get('/api/users/me');
          setUser(response.data);
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    toast.info("Đã đăng xuất");
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          TheWineShop 🍷
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-links">Trang chủ</Link>
          </li>
          <li className="nav-item">
            <Link to="/" className="nav-links">Sản phẩm</Link>
          </li>
        </ul>

        <div className="nav-actions">
           <Link to="/cart" className="cart-icon">
              🛒 <span className="cart-count">0</span>
           </Link>

           {user ? (
             <div className="user-menu">
               <span className="user-name">Hi, {user.last_name}</span>
               <button onClick={handleLogout} className="logout-btn">Đăng xuất</button>
             </div>
           ) : (
             <div className="auth-buttons">
               <Link to="/login" className="nav-btn-login">Đăng nhập</Link>
               <Link to="/register" className="nav-btn-register">Đăng ký</Link>
             </div>
           )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;