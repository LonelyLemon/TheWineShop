import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginPage.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    city: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        middle_name: formData.middle_name || null,
        city: formData.city || null
      };

      await axiosClient.post('/api/users/register', payload);

      toast.success('Đăng ký thành công! Vui lòng kiểm tra email (hoặc console backend) để xác thực.');
      navigate('/login');
      
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
          toast.error(error.response.data.detail || 'Đăng ký thất bại.');
      } else {
          toast.error('Không thể kết nối đến server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: '500px' }}>
        <h2>Đăng ký Tài khoản</h2>
        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', gap: '10px' }}>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Họ</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                  placeholder="Nguyễn"
                />
             </div>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Tên</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                  placeholder="Văn A"
                />
             </div>
          </div>

          <div className="form-group">
            <label>Thành phố</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="TP. Hồ Chí Minh"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="email@example.com"
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
              placeholder="Mật khẩu"
            />
          </div>

          <div className="form-group">
            <label>Nhập lại mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder="Nhập lại mật khẩu"
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
          
          <div style={{ marginTop: '1rem', textAlign: 'center' }}>
            <Link to="/login" style={{ color: '#800020' }}>Đã có tài khoản? Đăng nhập ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;