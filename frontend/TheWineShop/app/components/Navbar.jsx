import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { cartCount, refreshCart } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await axiosClient.get('/api/users/me');
          setUser(response.data);
          refreshCart();
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        }
      }
    };
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    refreshCart();
    toast.info("Đã đăng xuất");
    navigate('/login');
  };

return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">TheWineShop 🍷</Link>

        <ul className="nav-menu">
          <li className="nav-item"><Link to="/" className="nav-links">Trang chủ</Link></li>
          <li className="nav-item"><Link to="/" className="nav-links">Sản phẩm</Link></li>
        </ul>
        <SearchBar />
        <div className="nav-actions">
           <Link to="/cart" className="cart-icon">
              🛒 <span className="cart-count">{cartCount}</span>
           </Link>

           {user ? (
             <div className="user-menu" style={{position: 'relative'}}>
               <span 
                 className="user-name" 
                 onClick={() => setShowDropdown(!showDropdown)}
                 style={{cursor: 'pointer'}}
               >
                 Hi, {user.last_name} ▼
               </span>
               
               {showDropdown && (
                 <div className="dropdown-menu">
                    <Link to="/orders" className="dropdown-item" onClick={() => setShowDropdown(false)}>Lịch sử đơn hàng</Link>
                    
                    <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>Hồ sơ cá nhân</Link>
                    
                    {(user.role === 'admin' || user.role === 'stock_manager') && (
                        <>
                            <Link to="/admin/products" className="dropdown-item" onClick={() => setShowDropdown(false)}>Quản lý Sản phẩm</Link>
                        </>
                    )}
                    
                    {user.role === 'admin' && (
                        <>
                          <Link to="/admin/orders" className="dropdown-item" onClick={() => setShowDropdown(false)}>Quản lý Đơn hàng</Link>
                          <Link to="/admin/users" className="dropdown-item" onClick={() => setShowDropdown(false)}>Quản lý Người dùng</Link>
                        </>
                    )}
                    
                    <div className="divider"></div>
                    <button onClick={handleLogout} className="dropdown-item logout">Đăng xuất</button>
                 </div>
               )}
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