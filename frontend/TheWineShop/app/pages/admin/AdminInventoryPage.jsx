import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import './AdminOrdersPage.css';

const AdminInventoryPage = () => {
  const [inventories, setInventories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wines, setWines] = useState([]);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const [importForm, setImportForm] = useState({
    wine_id: '',
    batch_code: '',
    quantity: 10,
    import_price: 0,
    expiry_date: '',
    shelf_location: ''
  });

  const [adjustForm, setAdjustForm] = useState({
    quantity_adjustment: 0,
    reason: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invRes, wineRes] = await Promise.all([
        axiosClient.get('/api/inventory?limit=50'),
        axiosClient.get('/api/products/wines?limit=100') 
      ]);
      setInventories(invRes.data);
      setWines(wineRes.data);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Lỗi tải dữ liệu kho");
    } finally {
      setLoading(false);
    }
  };

  // --- Handlers Import ---
  const handleImportChange = (e) => {
    const { name, value } = e.target;
    setImportForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
          ...importForm,
          quantity: parseInt(importForm.quantity),
          import_price: parseFloat(importForm.import_price),
          expiry_date: importForm.expiry_date || null
      };
      await axiosClient.post('/api/inventory/import', payload);
      toast.success("Nhập kho thành công!");
      setShowImportModal(false);
      setImportForm({ wine_id: '', batch_code: '', quantity: 10, import_price: 0, expiry_date: '', shelf_location: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi nhập kho");
    }
  };

  const openAdjustModal = (inventory) => {
      setSelectedInventory(inventory);
      setAdjustForm({ quantity_adjustment: 0, reason: '' });
      setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
      e.preventDefault();
      if (adjustForm.quantity_adjustment === 0) {
          toast.warning("Số lượng điều chỉnh phải khác 0");
          return;
      }
      
      try {
          await axiosClient.patch(`/api/inventory/${selectedInventory.id}/adjust`, {
              quantity_adjustment: parseInt(adjustForm.quantity_adjustment),
              reason: adjustForm.reason
          });
          
          toast.success("Điều chỉnh tồn kho thành công");
          setShowAdjustModal(false);
          fetchData();
      } catch (error) {
          toast.error(error.response?.data?.detail || "Lỗi điều chỉnh");
      }
  };

  const renderExpiry = (dateStr) => {
      if (!dateStr) return <span style={{color: '#888'}}>---</span>;
      const date = new Date(dateStr);
      const now = new Date();
      const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
      
      let color = 'green';
      if (diffDays < 0) color = 'red'; 
      else if (diffDays < 30) color = 'orange';

      return <span style={{color: color, fontWeight: 'bold'}}>{date.toLocaleDateString('vi-VN')}</span>;
  };

  if (loading) return <div>Đang tải kho hàng...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Quản lý Kho hàng</h1>
        <button className="create-btn" onClick={() => setShowImportModal(true)}>
          + Nhập hàng mới
        </button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th>Mã Lô (Batch)</th>
              <th>Số lượng tồn</th>
              <th>Giá vốn</th>
              <th>Vị trí / Hạn SD</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {inventories.map(item => (
              <tr key={item.id}>
                <td><strong>{item.wine_name}</strong></td>
                <td>
                    <span style={{background: '#f0f0f0', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace'}}>
                        {item.batch_code}
                    </span>
                </td>
                <td>
                    <span style={{fontSize: '1.1em', fontWeight: 'bold', color: item.quantity_available > 10 ? '#333' : 'red'}}>
                        {item.quantity_available}
                    </span>
                </td>
                <td>{new Intl.NumberFormat('vi-VN').format(item.import_price)} đ</td>
                <td>
                    <div>📍 {item.shelf_location || '---'}</div>
                    <div style={{fontSize: '12px'}}>🕒 {renderExpiry(item.expiry_date)}</div>
                </td>
                <td>
                    <button 
                        onClick={() => openAdjustModal(item)}
                        style={{
                            padding: '4px 8px', 
                            background: '#faad14', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            fontSize: '12px'
                        }}
                    >
                        🛠️ Điều chỉnh
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showImportModal && (
        <div className="modal-overlay" style={modalOverlayStyle}>
            <div className="modal-content" style={modalContentStyle}>
                <h2>Nhập kho lô hàng mới</h2>
                <form onSubmit={handleImportSubmit} className="admin-form">
                    <div className="form-group">
                        <label>Sản phẩm *</label>
                        <select name="wine_id" value={importForm.wine_id} onChange={handleImportChange} required>
                            <option value="">-- Chọn rượu --</option>
                            {wines.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                        </select>
                    </div>
                    <div className="form-row">
                        <div className="form-group half">
                            <label>Mã Batch *</label>
                            <input type="text" name="batch_code" value={importForm.batch_code} onChange={handleImportChange} required />
                        </div>
                        <div className="form-group half">
                            <label>Vị trí kệ</label>
                            <input type="text" name="shelf_location" value={importForm.shelf_location} onChange={handleImportChange} />
                        </div>
                    </div>
                    <div className="form-row">
                         <div className="form-group half">
                            <label>Số lượng *</label>
                            <input type="number" name="quantity" value={importForm.quantity} onChange={handleImportChange} required />
                        </div>
                         <div className="form-group half">
                            <label>Giá nhập</label>
                            <input type="number" name="import_price" value={importForm.import_price} onChange={handleImportChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Hạn sử dụng</label>
                        <input type="date" name="expiry_date" value={importForm.expiry_date} onChange={handleImportChange} />
                    </div>
                    <div className="form-actions" style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                        <button type="button" onClick={() => setShowImportModal(false)} className="cancel-btn">Hủy</button>
                        <button type="submit" className="submit-btn">Xác nhận Nhập</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {showAdjustModal && selectedInventory && (
        <div className="modal-overlay" style={modalOverlayStyle}>
            <div className="modal-content" style={{...modalContentStyle, width: '400px'}}>
                <h2>Điều chỉnh tồn kho</h2>
                <p><strong>Lô:</strong> {selectedInventory.batch_code} ({selectedInventory.wine_name})</p>
                <p><strong>Tồn hiện tại:</strong> {selectedInventory.quantity_available}</p>
                
                <form onSubmit={handleAdjustSubmit} className="admin-form">
                    <div className="form-group">
                        <label>Số lượng điều chỉnh (+/-) *</label>
                        <input 
                            type="number" 
                            value={adjustForm.quantity_adjustment} 
                            onChange={(e) => setAdjustForm({...adjustForm, quantity_adjustment: e.target.value})}
                            required 
                            placeholder="Ví dụ: -5 (Giảm), 10 (Tăng)"
                        />
                        <small style={{color: '#666'}}>Nhập số âm để trừ kho (hỏng, vỡ), số dương để thêm (kiểm kê thừa).</small>
                    </div>
                    <div className="form-group">
                        <label>Lý do</label>
                        <textarea 
                            rows="2"
                            value={adjustForm.reason} 
                            onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                            placeholder="VD: Vỡ khi vận chuyển, Kiểm kê cuối tháng..."
                        />
                    </div>

                    <div className="form-actions" style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                        <button type="button" onClick={() => setShowAdjustModal(false)} className="cancel-btn">Hủy</button>
                        <button type="submit" className="submit-btn" style={{background: '#faad14'}}>Lưu điều chỉnh</button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
};

const modalOverlayStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
};

const modalContentStyle = {
    background: 'white', padding: '25px', borderRadius: '8px', width: '500px', maxWidth: '90%'
};

export default AdminInventoryPage;