import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import './AdminOrdersPage.css';

const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    discount_percentage: 10,
    start_date: '',
    end_date: '',
    is_active: true,
    trigger_type: 'period',
    min_quantity: 0
  });

  useEffect(() => {
    fetchPromos();
  }, []);

  const fetchPromos = async () => {
    try {
      const res = await axiosClient.get('/api/products/promotions');
      setPromotions(res.data);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Lỗi tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Xóa khuyến mãi này?")) return;
    try {
      await axiosClient.delete(`/api/products/promotions/${id}`);
      toast.success("Đã xóa");
      fetchPromos();
    // eslint-disable-next-line no-unused-vars
    } catch (e) {
      toast.error("Lỗi xóa");
    }
  };

  const handleToggle = async (id) => {
    try {
        await axiosClient.patch(`/api/products/promotions/${id}/toggle`);
        fetchPromos();
    // eslint-disable-next-line no-unused-vars
    } catch (e) { toast.error("Lỗi cập nhật"); }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          const payload = {
              ...formData,
              discount_percentage: parseFloat(formData.discount_percentage),
              min_quantity: parseInt(formData.min_quantity),
              code: formData.trigger_type === 'coupon' ? formData.code : null 
          };
          
          await axiosClient.post('/api/products/promotions', payload);
          toast.success("Tạo khuyến mãi thành công");
          setShowModal(false);
          fetchPromos();
          setFormData({
            name: '', code: '', description: '', discount_percentage: 10,
            start_date: '', end_date: '', is_active: true, trigger_type: 'period', min_quantity: 0
          });
      } catch (error) {
          toast.error(error.response?.data?.detail || "Lỗi tạo khuyến mãi");
      }
  };

  const handleChange = (e) => {
      const {name, value, type, checked} = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
      }));
  };

  const getTypeLabel = (type) => {
      switch(type) {
          case 'period': return 'Theo thời gian';
          case 'volume': return 'Theo số lượng';
          case 'vip': return 'Khách VIP';
          case 'coupon': return 'Mã giảm giá (Coupon)';
          default: return type;
      }
  };

  if(loading) return <div>Đang tải...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Quản lý Khuyến mãi</h1>
        <button className="create-btn" onClick={() => setShowModal(true)}>+ Tạo mới</button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
            <thead>
                <tr>
                    <th>Tên / Mô tả</th>
                    <th>Loại & Điều kiện</th>
                    <th>Giảm giá</th>
                    <th>Thời gian</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>
            </thead>
            <tbody>
                {promotions.map(p => (
                    <tr key={p.id} style={{opacity: p.is_active ? 1 : 0.6}}>
                        <td>
                            <strong>{p.name}</strong>
                            {p.code && <div style={{color: 'blue', fontWeight: 'bold'}}>CODE: {p.code}</div>}
                            <small>{p.description}</small>
                        </td>
                        <td>
                            <span className="badge" style={{background: '#eee', padding: '3px 6px', borderRadius: '4px'}}>
                                {getTypeLabel(p.trigger_type)}
                            </span>
                            {p.trigger_type === 'volume' && <div>Min: {p.min_quantity} chai</div>}
                        </td>
                        <td style={{color: 'green', fontWeight: 'bold'}}>{p.discount_percentage}%</td>
                        <td style={{fontSize: '13px'}}>
                            {new Date(p.start_date).toLocaleDateString('vi-VN')} <br/>
                            ➡ {new Date(p.end_date).toLocaleDateString('vi-VN')}
                        </td>
                        <td>
                            <button onClick={() => handleToggle(p.id)} style={{cursor: 'pointer', border: 'none', background: 'none'}}>
                                {p.is_active ? '✅ Active' : '❌ Inactive'}
                            </button>
                        </td>
                        <td>
                            <button onClick={() => handleDelete(p.id)} style={{color: 'red', border: 'none', background: 'none', cursor: 'pointer'}}>Xóa</button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {showModal && (
          <div className="modal-overlay" style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
              <div className="modal-content" style={{background:'white', padding:'30px', borderRadius:'8px', width:'500px', maxHeight: '90vh', overflowY: 'auto'}}>
                  <h2>Tạo Khuyến mãi mới</h2>
                  <form onSubmit={handleSubmit} className="admin-form">
                      <div className="form-group">
                          <label>Tên chương trình *</label>
                          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                      </div>
                      
                      <div className="form-row">
                          <div className="form-group half">
                              <label>Loại hình *</label>
                              <select name="trigger_type" value={formData.trigger_type} onChange={handleChange}>
                                  <option value="period">Theo thời gian</option>
                                  <option value="volume">Theo số lượng (Volume)</option>
                                  <option value="vip">Khách VIP (Role)</option>
                                  <option value="coupon">Mã Coupon</option>
                              </select>
                          </div>
                          <div className="form-group half">
                              <label>Mức giảm (%) *</label>
                              <input type="number" step="0.5" name="discount_percentage" value={formData.discount_percentage} onChange={handleChange} required />
                          </div>
                      </div>

                      {formData.trigger_type === 'coupon' && (
                          <div className="form-group">
                              <label>Mã Coupon (VD: SALE50) *</label>
                              <input type="text" name="code" value={formData.code} onChange={handleChange} required placeholder="Nhập mã không dấu" />
                          </div>
                      )}

                      {formData.trigger_type === 'volume' && (
                          <div className="form-group">
                              <label>Số lượng mua tối thiểu *</label>
                              <input type="number" name="min_quantity" value={formData.min_quantity} onChange={handleChange} required />
                          </div>
                      )}

                      <div className="form-row">
                          <div className="form-group half">
                              <label>Bắt đầu *</label>
                              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required />
                          </div>
                          <div className="form-group half">
                              <label>Kết thúc *</label>
                              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required />
                          </div>
                      </div>

                      <div className="form-group">
                          <label>Mô tả</label>
                          <textarea name="description" value={formData.description} onChange={handleChange}></textarea>
                      </div>

                      <div style={{display:'flex', gap:'10px', marginTop:'15px'}}>
                          <button type="button" onClick={() => setShowModal(false)} style={{flex:1, padding:'10px'}}>Hủy</button>
                          <button type="submit" style={{flex:2, padding:'10px', background:'#28a745', color:'white', border:'none'}}>Tạo</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPromotionsPage;