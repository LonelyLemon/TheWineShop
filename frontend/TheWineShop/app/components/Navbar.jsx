import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axiosClient from '../api/axiosClient';
import SearchBar from './SearchBar';
import './Navbar.css';

const Navbar = () => {
  const { cartTotal } = useCart();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await axiosClient.get('/api/products/categories');
        setCategories(res.data);
      } catch (e) { console.error(e); }
    };
    fetchCats();

    const token = localStorage.getItem('access_token');
    if (token) {
        axiosClient.get('/api/users/me')
            .then(res => setUser(res.data))
            .catch(() => setUser(null));
    }

    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
      localStorage.removeItem('access_token');
      setUser(null);
      navigate('/login');
      window.location.reload();
  };

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          THE WINE SHOP
        </Link>

        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-links">Trang Chủ</Link>
          </li>
          
          <li className="nav-item dropdown">
            <Link to="/products" className="nav-links">
              Sản Phẩm <i className="fas fa-caret-down"></i>
            </Link>
            <div className="dropdown-content">
                <Link to="/products">Tất cả sản phẩm</Link>
                {categories.map(cat => (
                    <Link key={cat.id} to={`/products?category=${cat.id}`}>
                        {cat.name}
                    </Link>
                ))}
            </div>
          </li>

          <li className="nav-item">
            <Link to="/blog" className="nav-links">Kiến Thức</Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-links">Về Chúng Tôi</Link>
          </li>
        </ul>
        <SearchBar />
        <div className="nav-icons">

            <Link to="/cart" className="icon-item cart-icon">
                🛒
                {cartTotal > 0 && <span className="cart-badge">{cartTotal}</span>}
            </Link>

            <div className="icon-item user-action">
                {user ? (
                    <div className="user-dropdown">
                        <span className="user-name">Chào, {user.first_name || 'Bạn'} ▼</span>
                        <div className="user-menu">
                            <Link to="/profile">Hồ sơ</Link>
                            <Link to="/orders">Đơn hàng</Link>
                            {(user.role === 'admin' || user.role === 'stock_manager') && <Link to="/admin">Quản trị</Link>}
                            <button onClick={handleLogout}>Đăng xuất</button>
                        </div>
                    </div>
                ) : (
                    <Link to="/login" className="login-btn">Đăng nhập</Link>
                )}
            </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;