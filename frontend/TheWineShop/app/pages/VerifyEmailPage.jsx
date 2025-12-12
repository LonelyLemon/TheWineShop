import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    if (!token) {
      setStatus('Token không hợp lệ.');
      return;
    }

    const verify = async () => {
      try {
        await axiosClient.get(`/api/users/verify-email?token=${token}`);
        toast.success('Xác thực tài khoản thành công! Hãy đăng nhập.');
        setStatus('Thành công! Đang chuyển hướng...');
        setTimeout(() => navigate('/login'), 2000);
      } catch (error) {
        console.error(error);
        setStatus('Xác thực thất bại hoặc Token đã hết hạn.');
        toast.error('Xác thực thất bại.');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        flexDirection: 'column' 
    }}>
      <h2>{status}</h2>
      {!token && <a href="/login">Quay lại đăng nhập</a>}
    </div>
  );
};

export default VerifyEmailPage;