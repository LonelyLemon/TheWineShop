import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const response = await axiosClient.post('/api/auth/login', formData);

      localStorage.setItem('access_token', response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);

      toast.success('Đăng nhập thành công!');
      
      navigate('/');
      
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
          toast.error(error.response.data.detail || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.');
      } else {
          toast.error('Không thể kết nối đến server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đăng nhập TheWineShop</h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="nhap_email@example.com"
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/register" style={{ color: '#800020' }}>Chưa có tài khoản? Đăng ký ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;