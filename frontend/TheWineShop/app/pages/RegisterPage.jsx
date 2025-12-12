import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './LoginPage.css';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';


const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const schema = yup.object().shape({
    last_name: yup.string().required('Họ không được để trống'),
    first_name: yup.string().required('Tên không được để trống'),
    city: yup.string(),
    email: yup.string().email('Email không hợp lệ').required('Email là bắt buộc'),
    password: yup.string()
      .required('Mật khẩu là bắt buộc')
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
      .matches(/[a-z]/, 'Phải chứa ít nhất 1 chữ thường')
      .matches(/[A-Z]/, 'Phải chứa ít nhất 1 chữ hoa')
      .matches(/[0-9]/, 'Phải chứa ít nhất 1 số'),
    confirmPassword: yup.string()
      .oneOf([yup.ref('password'), null], 'Mật khẩu xác nhận không khớp')
      .required('Vui lòng xác nhận mật khẩu'),
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        email: data.email,
        password: data.password,
        first_name: data.first_name,
        last_name: data.last_name,
        middle_name: null,
        city: data.city || null
      };

      await axiosClient.post('/api/users/register', payload);

      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      navigate('/login');
      
    } catch (error) {
      if (error.response && error.response.data) {
          toast.error(error.response.data.detail || 'Đăng ký thất bại.');
      } else {
          toast.error('Không thể kết nối đến server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getErrorClass = (fieldName) => errors[fieldName] ? 'input-error' : '';

  return (
    <div className="login-container">
      <div className="login-box" style={{ maxWidth: '500px' }}>
        <h2>Đăng ký Tài khoản</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <div style={{ display: 'flex', gap: '10px' }}>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Họ (*)</label>
                <input
                  type="text"
                  placeholder="Nguyễn"
                  className={getErrorClass('last_name')}
                  {...register('last_name')}
                />
                <p className="error-text">{errors.last_name?.message}</p>
             </div>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Tên (*)</label>
                <input
                  type="text"
                  placeholder="Văn A"
                  className={getErrorClass('first_name')}
                  {...register('first_name')}
                />
                <p className="error-text">{errors.first_name?.message}</p>
             </div>
          </div>

          <div className="form-group">
            <label>Thành phố</label>
            <input
              type="text"
              placeholder="TP. Hồ Chí Minh"
              {...register('city')}
            />
          </div>

          <div className="form-group">
            <label>Email (*)</label>
            <input
              type="email"
              placeholder="email@example.com"
              className={getErrorClass('email')}
              {...register('email')}
            />
            <p className="error-text">{errors.email?.message}</p>
          </div>

          <div className="form-group">
            <label>Mật khẩu (*)</label>
            <input
              type="password"
              placeholder="Ít nhất 8 ký tự, hoa, thường, số"
              className={getErrorClass('password')}
              {...register('password')}
            />
            <p className="error-text">{errors.password?.message}</p>
          </div>

          <div className="form-group">
            <label>Nhập lại mật khẩu (*)</label>
            <input
              type="password"
              placeholder="Nhập lại mật khẩu"
              className={getErrorClass('confirmPassword')}
              {...register('confirmPassword')}
            />
            <p className="error-text">{errors.confirmPassword?.message}</p>
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