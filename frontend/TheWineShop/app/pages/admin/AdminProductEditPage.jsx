import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import './AdminOrdersPage.css';

const AdminProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [wineries, setWineries] = useState([]);
  const [allGrapes, setAllGrapes] = useState([]);

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

  // 1. Load Product Detail
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, winRes, grapeRes, productRes] = await Promise.all([
            axiosClient.get('/api/products/categories'),
            axiosClient.get('/api/products/wineries'),
            axiosClient.get('/api/products/grapes'),
            axiosClient.get(`/api/products/wines/${id}`)
        ]);

        setCategories(catRes.data);
        setWineries(winRes.data);
        setAllGrapes(grapeRes.data);

        const product = productRes.data;
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price,
            alcohol_percentage: product.alcohol_percentage || 0,
            volume: product.volume || 750,
            vintage: product.vintage || 2024,
            category_id: product.category?.id || '',
            winery_id: product.winery?.id || '',
            image_url: product.images.length > 0 ? product.images[0].image_url : '',
            
            grapes: product.grapes.map(g => ({
                grape_variety_id: g.grape_variety.id,
                percentage: g.percentage,
                order: g.order
            }))
        });

      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error("Không thể tải dữ liệu sản phẩm");
        navigate('/admin/products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // Handlers
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
    setSaving(true);

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

      await axiosClient.patch(`/api/products/wines/${id}`, payload);
      toast.success("Cập nhật thành công!");
      navigate('/admin/products');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Lỗi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;

  return (
    <div className="admin-container">
      <h1>Chỉnh sửa Sản phẩm</h1>
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
                <label>Niên vụ *</label>
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
            <label style={{fontWeight: 'bold', marginBottom: '10px', display: 'block'}}>Thành phần nho</label>
            
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
        </div>

        <div className="form-group">
            <label>Mô tả chi tiết</label>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange}></textarea>
        </div>

        <div style={{display: 'flex', gap: '10px'}}>
             <button type="button" onClick={() => navigate('/admin/products')} style={{padding: '15px', flex: 1, cursor: 'pointer'}}>Hủy</button>
             <button type="submit" className="submit-btn" disabled={saving} style={{padding: '15px', flex: 2, background: '#28a745', color: 'white', border: 'none', cursor: 'pointer'}}>
                {saving ? 'Đang lưu...' : 'LƯU THAY ĐỔI'}
             </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductEditPage;