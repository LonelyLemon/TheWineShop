import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import './LoginPage.css';

const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const schema = yup.object().shape({
    first_name: yup.string().required('Tên không được để trống'),
    last_name: yup.string().required('Họ không được để trống'),
    phone_number: yup.string()
        .matches(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, { 
            message: 'Số điện thoại không hợp lệ (VN)', 
            excludeEmptyString: true 
        })
        .nullable(),
    address: yup.string().nullable(),
    city: yup.string().nullable(),
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosClient.get('/api/users/me');
        const user = response.data;
        
        setValue('first_name', user.first_name);
        setValue('last_name', user.last_name);
        setValue('email', user.email);
        setValue('phone_number', user.phone_number);
        setValue('address', user.address);
        setValue('city', user.city);
        
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error("Không tải được thông tin cá nhân");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchUser();
  }, [setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // eslint-disable-next-line no-unused-vars
      const { email, ...updateData } = data;
      
      Object.keys(updateData).forEach(key => {
          if (updateData[key] === '') updateData[key] = null;
      });

      await axiosClient.post('/api/users/update-user', updateData);
      toast.success("Cập nhật thông tin thành công!");
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Cập nhật thất bại. Có thể số điện thoại đã tồn tại.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div style={{textAlign:'center', padding:'2rem'}}>Đang tải...</div>;

  return (
    <div className="login-container" style={{height: 'auto', padding: '2rem 0', minHeight: '80vh'}}>
      <div className="login-box" style={{ maxWidth: '600px' }}>
        <h2 style={{borderBottom: '1px solid #eee', paddingBottom: '1rem'}}>Hồ sơ cá nhân</h2>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Email (Không thể thay đổi)</label>
            <input type="email" {...register('email')} disabled style={{background: '#f0f0f0', cursor: 'not-allowed'}} />
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Họ (*)</label>
                <input type="text" {...register('last_name')} className={errors.last_name ? 'input-error' : ''}/>
                <p className="error-text">{errors.last_name?.message}</p>
             </div>
             <div className="form-group" style={{ flex: 1 }}>
                <label>Tên (*)</label>
                <input type="text" {...register('first_name')} className={errors.first_name ? 'input-error' : ''}/>
                <p className="error-text">{errors.first_name?.message}</p>
             </div>
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input type="text" {...register('phone_number')} placeholder="09xxxxxxx" className={errors.phone_number ? 'input-error' : ''}/>
            <p className="error-text">{errors.phone_number?.message}</p>
          </div>

          <div className="form-group">
            <label>Địa chỉ</label>
            <input type="text" {...register('address')} placeholder="Số nhà, tên đường..." />
          </div>

          <div className="form-group">
            <label>Thành phố</label>
            <input type="text" {...register('city')} />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;