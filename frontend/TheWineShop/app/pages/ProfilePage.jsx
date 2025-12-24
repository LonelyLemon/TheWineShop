import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './LoginPage.css'; 

const ProfilePage = () => {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // State để hiển thị ảnh preview
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Ref để trigger input file ẩn
  const fileInputRef = useRef(null);

  const schema = yup.object().shape({
    first_name: yup.string().required('Tên không được để trống'),
    last_name: yup.string().required('Họ không được để trống'),
    phone_number: yup.string().nullable(),
    address_line_1: yup.string().nullable(),
    city: yup.string().nullable(),
    avatar_url: yup.string().nullable()
  });

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get('/api/users/me');
        const user = response.data;
        
        setValue('first_name', user.first_name);
        setValue('last_name', user.last_name);
        setValue('phone_number', user.phone_number);
        setValue('address_line_1', user.address_line_1);
        setValue('city', user.city);
        
        setAvatarPreview(user.avatar_url);
        
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error("Không thể tải thông tin người dùng");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProfile();
  }, [setValue]);

  // --- Xử lý Upload Avatar ---
  const handleAvatarChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
          toast.error("Vui lòng chọn file ảnh");
          return;
      }
      if (file.size > 5 * 1024 * 1024) {
          toast.error("Kích thước ảnh không được quá 5MB");
          return;
      }

      setUploadingAvatar(true);
      try {
          const formData = new FormData();
          formData.append('file', file);

          // 1. Upload ảnh lên API Media
          const response = await axiosClient.post('/api/media/upload/image', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });

          const { s3_key, url } = response.data;

          // 2. Cập nhật Preview ngay lập tức
          setAvatarPreview(url);

          // 3. Set s3_key vào form data để chuẩn bị gửi lệnh Update User
          // Lưu ý: Ta set vào field 'avatar_url' của form, nhưng giá trị là KEY
          setValue('avatar_url', s3_key, { shouldDirty: true });
          
          toast.success("Tải ảnh lên xong. Hãy bấm Lưu thay đổi.");

      } catch (error) {
          console.error(error);
          toast.error("Lỗi khi tải ảnh lên.");
      } finally {
          setUploadingAvatar(false);
      }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await axiosClient.post('/api/users/update-user', data);
      
      toast.success("Cập nhật thông tin thành công!");
      
      // Refresh lại trang hoặc state nếu cần để đồng bộ
      // window.location.reload(); 
    } catch (error) {
      console.error(error);
      toast.error("Cập nhật thất bại.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div style={{textAlign: 'center', marginTop: '50px'}}>Loading...</div>;

  return (
    <div className="login-container" style={{ paddingTop: '50px', paddingBottom: '50px' }}>
      <div className="login-card" style={{ maxWidth: '800px' }}>
        <h2>Thông tin cá nhân</h2>
        
        <form onSubmit={handleSubmit(onSubmit)} style={{ marginTop: '20px' }}>
          
          {/* --- Avatar Section --- */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
              <div 
                style={{ 
                    width: '120px', 
                    height: '120px', 
                    borderRadius: '50%', 
                    overflow: 'hidden', 
                    marginBottom: '10px',
                    border: '3px solid #800020',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
              >
                  {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                  ) : (
                      <span style={{ fontSize: '3rem', color: '#ccc' }}>👤</span>
                  )}
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                ref={fileInputRef}
                onChange={handleAvatarChange}
              />
              
              <button 
                type="button"
                className="login-btn"
                style={{ width: 'auto', padding: '5px 15px', fontSize: '0.9rem' }}
                onClick={() => fileInputRef.current.click()}
                disabled={uploadingAvatar}
              >
                  {uploadingAvatar ? 'Đang tải lên...' : 'Đổi ảnh đại diện'}
              </button>
          </div>
          {/* ---------------------- */}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
             <div className="form-group">
                <label>Họ</label>
                <input {...register('last_name')} />
                <p className="error-text">{errors.last_name?.message}</p>
             </div>
             <div className="form-group">
                <label>Tên</label>
                <input {...register('first_name')} />
                <p className="error-text">{errors.first_name?.message}</p>
             </div>
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input {...register('phone_number')} placeholder="0909 xxx xxx" />
          </div>

          <div className="form-group">
            <label>Địa chỉ</label>
            <input {...register('address_line_1')} placeholder="Số nhà, tên đường" />
          </div>

          <div className="form-group">
            <label>Thành phố</label>
            <input {...register('city')} />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;