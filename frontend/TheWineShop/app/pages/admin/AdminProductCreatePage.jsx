import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import './AdminOrdersPage.css';

const AdminProductCreatePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [categories, setCategories] = useState([]);
  const [wineries, setWineries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [allGrapes, setAllGrapes] = useState([]);

  const [showCatModal, setShowCatModal] = useState(false);
  const [showWineryModal, setShowWineryModal] = useState(false);
  const [showGrapeModal, setShowGrapeModal] = useState(false);

  const [newCatName, setNewCatName] = useState('');
  const [newGrapeName, setNewGrapeName] = useState('');
  
  const [newWineryData, setNewWineryData] = useState({ name: '', region_id: '', new_region_name: '' });
  const [isCreatingRegion, setIsCreatingRegion] = useState(false);

  const [uploadingImg, setUploadingImg] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);
  const fileInputRef = useRef(null);

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

  const fetchMasterData = async () => {
      try {
        const [catRes, winRes, grapeRes, regionRes] = await Promise.all([
            axiosClient.get('/api/products/categories'),
            axiosClient.get('/api/products/wineries'),
            axiosClient.get('/api/products/grapes'),
            axiosClient.get('/api/products/regions')
        ]);
        setCategories(catRes.data);
        setWineries(winRes.data);
        setAllGrapes(grapeRes.data);
        setRegions(regionRes.data);
      } catch (error) {
        toast.error("Không thể tải dữ liệu danh mục");
        console.log(error);
      }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageChange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingImg(true);
      try {
          const uploadData = new FormData();
          uploadData.append('file', file);
          const response = await axiosClient.post('/api/media/upload/image', uploadData, {
              headers: { 'Content-Type': 'multipart/form-data' }
          });
          const { s3_key, url } = response.data;
          setPreviewImg(url);
          setFormData(prev => ({ ...prev, image_url: s3_key }));
          toast.success("Đã tải ảnh lên");
      } catch (error) { console.error(error); toast.error("Lỗi upload ảnh"); } 
      finally { setUploadingImg(false); }
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

  const handleQuickCreateCategory = async () => {
      if (!newCatName) return;
      try {
          const res = await axiosClient.post('/api/products/categories', { name: newCatName });
          toast.success("Đã thêm loại vang: " + res.data.name);
          setCategories([...categories, res.data]);
          setFormData(prev => ({ ...prev, category_id: res.data.id }));
          setShowCatModal(false); setNewCatName('');
      } catch (err) { toast.error(err.response?.data?.detail || "Lỗi tạo loại vang"); }
  };

  const handleQuickCreateGrape = async () => {
      if (!newGrapeName) return;
      try {
          const res = await axiosClient.post('/api/products/grapes', { name: newGrapeName });
          toast.success("Đã thêm giống nho: " + res.data.name);
          setAllGrapes([...allGrapes, res.data]);
          setShowGrapeModal(false); setNewGrapeName('');
      } catch (err) { toast.error(err.response?.data?.detail || "Lỗi tạo giống nho"); }
  };

  const handleQuickCreateWinery = async () => {
      if (!newWineryData.name) return;
      
      let finalRegionId = newWineryData.region_id;

      if (isCreatingRegion && newWineryData.new_region_name) {
          try {
              const regRes = await axiosClient.post('/api/products/regions', { name: newWineryData.new_region_name });
              finalRegionId = regRes.data.id;
              setRegions([...regions, regRes.data]);
          } catch (err) {
              toast.error("Lỗi tạo vùng: " + err.response?.data?.detail);
              console.log(err);
              return;
          }
      }

      try {
          const payload = { 
              name: newWineryData.name, 
              region_id: finalRegionId || null 
          };
          const winRes = await axiosClient.post('/api/products/wineries', payload);
          toast.success("Đã thêm NSX: " + winRes.data.name);
          setWineries([...wineries, winRes.data]);
          setFormData(prev => ({ ...prev, winery_id: winRes.data.id }));
          setShowWineryModal(false); 
          setNewWineryData({ name: '', region_id: '', new_region_name: '' });
          setIsCreatingRegion(false);
      } catch (err) { toast.error(err.response?.data?.detail || "Lỗi tạo NSX"); }
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
      toast.error(error.response?.data?.detail || "Lỗi khi tạo sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const modalOverlayStyle = {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };
  const modalContentStyle = {
      background: 'white', padding: '20px', borderRadius: '8px', minWidth: '400px', maxWidth: '90%'
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
                <div style={{display: 'flex', gap: '5px'}}>
                    <select name="category_id" value={formData.category_id} onChange={handleChange} required style={{flex: 1}}>
                        <option value="">-- Chọn loại --</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCatModal(true)} style={{background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', width: '40px', cursor: 'pointer'}}>+</button>
                </div>
            </div>
            <div className="form-group half">
                <label>Nhà sản xuất (Winery) *</label>
                <div style={{display: 'flex', gap: '5px'}}>
                    <select name="winery_id" value={formData.winery_id} onChange={handleChange} required style={{flex: 1}}>
                        <option value="">-- Chọn Winery --</option>
                        {wineries.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.region?.name})</option>
                        ))}
                    </select>
                    <button type="button" onClick={() => setShowWineryModal(true)} style={{background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', width: '40px', cursor: 'pointer'}}>+</button>
                </div>
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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                <label style={{fontWeight: 'bold'}}>Thành phần nho</label>
                <button type="button" onClick={() => setShowGrapeModal(true)} style={{fontSize: '0.8rem', background: 'none', border: '1px solid #ccc', padding: '2px 8px', cursor: 'pointer', borderRadius: '4px'}}>+ Tạo giống nho mới</button>
            </div>
            
            {formData.grapes.map((row, index) => (
                <div key={index} style={{display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center'}}>
                    <select style={{flex: 2}} value={row.grape_variety_id} onChange={(e) => handleGrapeChange(index, 'grape_variety_id', e.target.value)}>
                        <option value="">-- Chọn giống nho --</option>
                        {allGrapes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                    <input type="number" placeholder="%" style={{flex: 1}} value={row.percentage} onChange={(e) => handleGrapeChange(index, 'percentage', parseInt(e.target.value))}/>
                    <input type="number" placeholder="Thứ tự" style={{flex: 1}} value={row.order} onChange={(e) => handleGrapeChange(index, 'order', parseInt(e.target.value))}/>
                    <button type="button" onClick={() => handleRemoveGrapeRow(index)} style={{background: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer'}}>X</button>
                </div>
            ))}
            <button type="button" onClick={handleAddGrapeRow} style={{background: '#1890ff', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px'}}>+ Thêm dòng</button>
        </div>

        <div className="form-group">
            <label>Ảnh sản phẩm</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '5px' }}>
                <div style={{ width: '100px', height: '100px', border: '1px dashed #ccc', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9f9f9'}}>
                    {previewImg ? <img src={previewImg} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <span style={{fontSize: '2rem', color: '#ddd'}}>📷</span>}
                </div>
                <div>
                    <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImageChange} />
                    <button type="button" style={{ padding: '8px 15px', cursor: 'pointer', background: '#666', color: 'white', border: 'none', borderRadius: '4px' }} onClick={() => fileInputRef.current.click()} disabled={uploadingImg}>{uploadingImg ? 'Đang tải...' : 'Chọn ảnh từ máy'}</button>
                </div>
            </div>
        </div>

        <div className="form-group">
            <label>Mô tả chi tiết</label>
            <textarea name="description" rows="4" value={formData.description} onChange={handleChange}></textarea>
        </div>

        <button type="submit" className="submit-btn" disabled={loading} style={{width: '100%', padding: '15px', fontSize: '16px', background: '#28a745', color: 'white', border: 'none', cursor: 'pointer'}}>{loading ? 'Đang xử lý...' : 'TẠO SẢN PHẨM'}</button>
      </form>
      
      {/* 1. Category Modal */}
      {showCatModal && (
          <div style={modalOverlayStyle}>
              <div style={modalContentStyle}>
                  <h3>Thêm Loại Vang Mới</h3>
                  <input type="text" placeholder="Tên loại vang (VD: Vang Cam)" value={newCatName} onChange={e => setNewCatName(e.target.value)} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                      <button type="button" onClick={() => setShowCatModal(false)}>Hủy</button>
                      <button type="button" onClick={handleQuickCreateCategory} style={{background: '#1890ff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px'}}>Lưu</button>
                  </div>
              </div>
          </div>
      )}

      {/* 2. Grape Modal */}
      {showGrapeModal && (
          <div style={modalOverlayStyle}>
              <div style={modalContentStyle}>
                  <h3>Thêm Giống Nho Mới</h3>
                  <input type="text" placeholder="Tên giống nho (VD: Malbec)" value={newGrapeName} onChange={e => setNewGrapeName(e.target.value)} style={{width: '100%', padding: '8px', marginBottom: '10px'}} />
                  <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                      <button type="button" onClick={() => setShowGrapeModal(false)}>Hủy</button>
                      <button type="button" onClick={handleQuickCreateGrape} style={{background: '#1890ff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px'}}>Lưu</button>
                  </div>
              </div>
          </div>
      )}

      {/* 3. Winery Modal */}
      {showWineryModal && (
          <div style={modalOverlayStyle}>
              <div style={modalContentStyle}>
                  <h3>Thêm Nhà Sản Xuất Mới</h3>
                  <div className="form-group">
                      <label>Tên Nhà SX</label>
                      <input type="text" value={newWineryData.name} onChange={e => setNewWineryData({...newWineryData, name: e.target.value})} style={{width: '100%', padding: '8px'}} />
                  </div>
                  
                  <div className="form-group">
                      <label>Vùng / Quốc gia</label>
                      {!isCreatingRegion ? (
                          <div style={{display: 'flex', gap: '5px'}}>
                              <select value={newWineryData.region_id} onChange={e => setNewWineryData({...newWineryData, region_id: e.target.value})} style={{flex: 1, padding: '8px'}}>
                                  <option value="">-- Chọn Vùng --</option>
                                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                              </select>
                              <button type="button" onClick={() => setIsCreatingRegion(true)} style={{background: '#faad14', border: 'none', color: 'white', padding: '0 10px', cursor: 'pointer'}}>Mới</button>
                          </div>
                      ) : (
                          <div style={{display: 'flex', gap: '5px'}}>
                              <input type="text" placeholder="Nhập tên vùng mới (VD: Chile)" value={newWineryData.new_region_name} onChange={e => setNewWineryData({...newWineryData, new_region_name: e.target.value})} style={{flex: 1, padding: '8px'}} autoFocus />
                              <button type="button" onClick={() => setIsCreatingRegion(false)} style={{background: '#ccc', border: 'none', padding: '0 10px', cursor: 'pointer'}}>Hủy</button>
                          </div>
                      )}
                  </div>

                  <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px'}}>
                      <button type="button" onClick={() => {setShowWineryModal(false); setIsCreatingRegion(false);}}>Đóng</button>
                      <button type="button" onClick={handleQuickCreateWinery} style={{background: '#1890ff', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px'}}>Lưu</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AdminProductCreatePage;