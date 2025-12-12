// app/pages/admin/AdminProductCreatePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import './AdminOrdersPage.css'; // Tái sử dụng CSS admin

const AdminProductCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Data sources cho Dropdown
  const [categories, setCategories] = useState([]);
  const [wineries, setWineries] = useState([]);
  const [allGrapes, setAllGrapes] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    alcohol_percentage: 0,
    volume: 750,
    vintage: 2024,
    category_id: '',
    winery_id: '',
    image_url: '',
    grapes: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, winRes, grapeRes] = await Promise.all([
            axiosClient.get('/api/products/categories'),
            axiosClient.get('/api/products/wineries'),
            axiosClient.get('/api/products/grapes')
        ]);
        setCategories(catRes.data);
        setWineries(winRes.data);
        setAllGrapes(grapeRes.data);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error("Không thể tải dữ liệu danh mục/nhà sản xuất");
      }
    };
    fetchData();
  }, []);

  // Xử lý thay đổi input thường
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddGrapeRow = () => {
    setFormData(prev => ({
        ...prev,
        grapes: [...prev.grapes, { grape_variety_id: '', percentage: 0, order: prev.grapes.length + 1 }]
    }));
  };

  const handleGrapeChange = (index, field, value) => {
    const newGrapes = [...formData.grapes];
    newGrapes[index][field] = value;
    setFormData(prev => ({ ...prev, grapes: newGrapes }));
  };

  const handleRemoveGrapeRow = (index) => {
    const newGrapes = formData.grapes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, grapes: newGrapes }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.price || !formData.winery_id || !formData.category_id) {
        toast.warning("Vui lòng điền các trường bắt buộc");
        setLoading(false);
        return;
    }

    try {
      const payload = {
          ...formData,
          images: formData.image_url ? [formData.image_url] : [],
          price: parseFloat(formData.price),
          alcohol_percentage: parseFloat(formData.alcohol_percentage),
          volume: parseInt(formData.volume),
          vintage: parseInt(formData.vintage),
          grapes: formData.grapes.filter(g => g.grape_variety_id)
      };

      await axiosClient.post('/api/products/wines', payload);
      toast.success("Tạo sản phẩm thành công!");
      navigate('/admin/products');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Lỗi khi tạo sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-container">
      <h1>Thêm Sản phẩm mới</h1>
      <form onSubmit={handleSubmit} className="admin-form" style={{maxWidth: '800px'}}>
        
        <div className="form-group">
            <label>Tên rượu *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="form-row">
            <div className="form-group half">
                <label>Loại vang *</label>
                <select name="category_id" value={formData.category_id} onChange={handleChange} required>
                    <option value="">-- Chọn loại --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <div className="form-group half">
                <label>Nhà sản xuất (Winery) *</label>
                <select name="winery_id" value={formData.winery_id} onChange={handleChange} required>
                    <option value="">-- Chọn Winery --</option>
                    {wineries.map(w => (
                        <option key={w.id} value={w.id}>{w.name} ({w.region?.name})</option>
                    ))}
                </select>
            </div>
        </div>

        <div className="form-row">
            <div className="form-group half">
                <label>Giá bán (VND) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required />
            </div>
            <div className="form-group half">
                <label>Niên vụ (Năm) *</label>
                <input type="number" name="vintage" value={formData.vintage} onChange={handleChange} />
            </div>
        </div>

        <div className="form-row">
            <div className="form-group half">
                <label>Nồng độ (%)</label>
                <input type="number" step="0.1" name="alcohol_percentage" value={formData.alcohol_percentage} onChange={handleChange} />
            </div>
            <div className="form-group half">
                <label>Dung tích (ml)</label>
                <input type="number" name="volume" value={formData.volume} onChange={handleChange} />
            </div>
        </div>

        <div className="form-group" style={{background: '#f9f9f9', padding: '15px', borderRadius: '8px', border: '1px solid #ddd'}}>
            <label style={{fontWeight: 'bold', marginBottom: '10px', display: 'block'}}>Thành phần nho (Grape Composition)</label>
            
            {formData.grapes.map((row, index) => (
                <div key={index} style={{display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center'}}>
                    <select 
                        style={{flex: 2}}
                        value={row.grape_variety_id} 
                        onChange={(e) => handleGrapeChange(index, 'grape_variety_id', e.target.value)}
                    >
                        <option value="">-- Chọn giống nho --</option>
                        {allGrapes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    
                    <input 
                        type="number" 
                        placeholder="%" 
                        style={{flex: 1}}
                        value={row.percentage} 
                        onChange={(e) => handleGrapeChange(index, 'percentage', parseInt(e.target.value))}
                    />
                    
                    <input 
                        type="number" 
                        placeholder="Thứ tự" 
                        style={{flex: 1}}
                        value={row.order} 
                        onChange={(e) => handleGrapeChange(index, 'order', parseInt(e.target.value))}
                    />

                    <button type="button" onClick={() => handleRemoveGrapeRow(index)} style={{background: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer'}}>X</button>
                </div>
            ))}
            
            <button type="button" onClick={handleAddGrapeRow} style={{background: '#1890ff', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px'}}>
                + Thêm thành phần nho
            </button>
        </div>

        <div className="form-group">
            <label>Ảnh sản phẩm (URL)</label>
            <input type="text" name="image_url" placeholder="https://..." value={formData.image_url} onChange={handleChange} />
            <small>Tạm thời nhập link ảnh trực tiếp</small>
        </div>

        <div className="form-group">
            <label>Mô tả chi tiết</label>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange}></textarea>
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{width: '100%', padding: '15px', fontSize: '16px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer'}}>
            {loading ? 'Đang xử lý...' : 'TẠO SẢN PHẨM'}
        </button>
      </form>
    </div>
  );
};

export default AdminProductCreatePage;