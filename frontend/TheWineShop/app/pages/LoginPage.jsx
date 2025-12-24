import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { useCart } from '../context/CartContext';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  
  const [viewMode, setViewMode] = useState('login'); 
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [resendEmail, setResendEmail] = useState('');
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
        } catch (mergeError) {
            console.warn("Merge cart failed", mergeError);
        }

        refreshCart();
        navigate('/');

    } catch (error) {
        console.error(error);
        const detail = error.response?.data?.detail;
        toast.error(detail || "Đăng nhập thất bại");
        
        if (detail === "User not verified" || error.response?.status === 401) {
            toast.warning("Vui lòng thử xác thực lại email")
        }
    } finally {
        setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
      e.preventDefault();
      if (!resendEmail) {
          toast.warning("Vui lòng nhập email.");
          return;
      }
      setLoading(true);
      try {
          await axiosClient.post('/api/users/resend-verification', { email: resendEmail });
          toast.success("Đã gửi lại email xác thực! Vui lòng kiểm tra hộp thư.");
          setViewMode('login');
      } catch (error) {
          console.error(error);
          toast.error(error.response?.data?.detail || "Gửi yêu cầu thất bại.");
      } finally {
          setLoading(false);
      }
  };

  const renderLoginForm = () => (
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

      <div className="login-footer" style={{ marginTop: '10px', fontSize: '0.9rem' }}>
          <span 
            onClick={() => setViewMode('resend')} 
            style={{ cursor: 'pointer', color: '#800020', textDecoration: 'underline' }}
          >
            Chưa nhận được email xác thực?
          </span>
      </div>
    </form>
  );

  const renderResendForm = () => (
      <form onSubmit={handleResendVerification}>
          <div className="form-group">
            <label>Nhập email tài khoản của bạn</label>
            <input 
                type="email" 
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                required 
                placeholder="name@example.com"
            />
          </div>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi lại Email'}
          </button>
          
          <div className="login-footer" style={{ marginTop: '10px' }}>
            <span 
                onClick={() => setViewMode('login')} 
                style={{ cursor: 'pointer', color: '#666' }}
            >
                Quay lại Đăng nhập
            </span>
          </div>
      </form>
  );

  return (
    <div className="login-container">
      <div className="login-card">
        {viewMode === 'login' ? (
            <>
                <h2>Đăng nhập</h2>
                <p className="login-subtitle">Chào mừng trở lại TheWineShop</p>
                {renderLoginForm()}
            </>
        ) : (
            <>
                <h2>Kích hoạt tài khoản</h2>
                <p className="login-subtitle">Gửi lại email xác thực tài khoản</p>
                {renderResendForm()}
            </>
        )}

        {viewMode === 'login' && (
            <div className="login-footer">
            <p>Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link></p>
            </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;