import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
        const formPayload = new FormData();
        formPayload.append('username', formData.username);
        formPayload.append('password', formData.password);

        const response = await axiosClient.post('/api/auth/login', formPayload, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const { access_token, refresh_token } = response.data;
        
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        toast.success("Đăng nhập thành công!");

        try {
            await axiosClient.post('/api/cart/merge');
            console.log("Cart merged");
        } catch (mergeError) {
            console.warn("Merge cart failed", mergeError);
        }

        refreshCart();

        navigate('/');

    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.detail || "Đăng nhập thất bại");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Đăng nhập</h2>
        <p className="login-subtitle">Chào mừng trở lại TheWineShop</p>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input 
                type="email" 
                name="username" 
                value={formData.username}
                onChange={handleChange}
                required 
                placeholder="name@example.com"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input 
                type="password" 
                name="password" 
                value={formData.password}
                onChange={handleChange}
                required 
                placeholder="••••••••"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className="login-footer">
          <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
          {/* <p><Link to="/forgot-password">Quên mật khẩu?</Link></p> */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;