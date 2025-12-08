import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import './AdminOrdersPage.css';

const AdminProductsPage = () => {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWines = async () => {
    try {
      const response = await axiosClient.get('/api/products/wines?limit=100'); 
      setWines(response.data);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Lỗi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWines();
  }, []);

  const handleDelete = async (id) => {
    if(!window.confirm("Bạn chắc chắn muốn ẩn sản phẩm này?")) return;
    try {
        await axiosClient.delete(`/api/products/wines/${id}`);
        toast.success("Đã ẩn sản phẩm");
        fetchWines();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        toast.error("Lỗi khi xóa");
    }
  }

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (loading) return <div className="admin-loading">Đang tải...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Quản lý Sản phẩm</h1>
        <div>
            <Link to="/admin/products/new" className="refresh-btn" style={{background: '#28a745', color: 'white', border: 'none', marginRight: '10px', textDecoration: 'none'}}>
                + Thêm mới
            </Link>
            <button className="refresh-btn" onClick={fetchWines}>🔄 Làm mới</button>
        </div>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Xuất xứ</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {wines.map(wine => (
              <tr key={wine.id}>
                <td>
                    <img src={wine.thumbnail || "https://via.placeholder.com/50"} alt="" style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}} />
                </td>
                <td>
                    <strong>{wine.name}</strong> <br/>
                    <small className="order-uuid">{wine.slug}</small>
                </td>
                <td>{wine.category?.name || '---'}</td>
                <td style={{color: '#800020', fontWeight: 'bold'}}>{formatPrice(wine.price)}</td>
                <td>{wine.country} - {wine.region}</td>
                <td>
                    <Link 
                      to={`/admin/products/${wine.id}`} 
                      className="refresh-btn" 
                      style={{marginRight: '5px', textDecoration: 'none', display: 'inline-block', color: 'black'}}
                    >
                      ✏️
                    </Link>
                   <button className="refresh-btn" style={{color: 'red', borderColor: 'red'}} onClick={() => handleDelete(wine.id)}>🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminProductsPage;