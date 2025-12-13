import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './LoginPage.css';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    title: 'Mr',
    phone_number: '',
    fax_number: '',
    address_line_1: '',
    city: '',
    zip_code: '',
    country: '',
    birthdate: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosClient.get('/api/users/me');
      setUser(res.data);

      const u = res.data;
      setFormData({
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        middle_name: u.middle_name || '',
        title: u.title || 'Mr',
        phone_number: u.phone_number || '',
        fax_number: u.fax_number || '',
        address_line_1: u.address_line_1 || u.address || '',
        city: u.city || '',
        zip_code: u.zip_code || '',
        country: u.country || '',
        birthdate: u.birthdate ? u.birthdate.split('T')[0] : ''
      });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Lỗi tải thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const payload = { ...formData };
      if (!payload.birthdate) delete payload.birthdate; 

      await axiosClient.post('/api/users/update-user', payload);
      toast.success("Cập nhật hồ sơ thành công!");
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="login-container" style={{maxWidth: '800px', padding: '20px'}}>
      <div className="login-card" style={{width: '100%', maxWidth: '100%'}}>
        <h2>Hồ sơ cá nhân</h2>
        <p className="login-subtitle">{user?.email}</p>

        <form onSubmit={handleUpdate} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div>
                <div className="form-group">
                    <label>Danh xưng (Title)</label>
                    <select name="title" value={formData.title} onChange={handleChange} style={{width: '100%', padding: '10px'}}>
                        <option value="Mr">Ông (Mr)</option>
                        <option value="Mrs">Bà (Mrs)</option>
                        <option value="Ms">Cô (Ms)</option>
                    </select>
                </div>
                <div className="form-group">
                    <label>Họ (Last Name)</label>
                    <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Tên đệm (Middle)</label>
                    <input type="text" name="middle_name" value={formData.middle_name} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Tên (First Name)</label>
                    <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Ngày sinh</label>
                    <input type="date" name="birthdate" value={formData.birthdate} onChange={handleChange} />
                </div>
            </div>

            <div>
                <div className="form-group">
                    <label>Số điện thoại</label>
                    <input type="text" name="phone_number" value={formData.phone_number} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Fax</label>
                    <input type="text" name="fax_number" value={formData.fax_number} onChange={handleChange} />
                </div>
                <div className="form-group">
                    <label>Địa chỉ</label>
                    <input type="text" name="address_line_1" value={formData.address_line_1} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Thành phố</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange} required />
                </div>
                <div className="form-group" style={{display: 'flex', gap: '10px'}}>
                    <div style={{flex: 1}}>
                        <label>Zip Code</label>
                        <input type="text" name="zip_code" value={formData.zip_code} onChange={handleChange} required />
                    </div>
                    <div style={{flex: 1}}>
                        <label>Quốc gia</label>
                        <input type="text" name="country" value={formData.country} onChange={handleChange} required />
                    </div>
                </div>
            </div>

            <button type="submit" className="login-btn" disabled={updating} style={{gridColumn: '1 / span 2', marginTop: '20px'}}>
                {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;