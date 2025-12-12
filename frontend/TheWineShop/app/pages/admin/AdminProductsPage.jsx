import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
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
    if (!window.confirm("Bạn chắc chắn muốn ẩn sản phẩm này?")) return;
    try {
      await axiosClient.delete(`/api/products/wines/${id}`);
      toast.success("Đã ẩn sản phẩm");
      fetchWines();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Lỗi xóa sản phẩm");
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Quản lý Sản phẩm</h1>
        <Link to="/admin/products/new" className="create-btn" style={{textDecoration: 'none'}}>
          + Thêm mới
        </Link>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Giá</th>
              <th>Nhà sản xuất / Vùng</th>
              <th>Loại</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {wines.map((wine) => (
              <tr key={wine.id}>
                <td>
                  <img 
                    src={wine.thumbnail || "https://via.placeholder.com/50"} 
                    alt="thumb" 
                    style={{width: '50px', height: 'auto', borderRadius: '4px'}}
                  />
                </td>
                <td>
                    <strong>{wine.name}</strong><br/>
                    <small style={{color: '#666'}}>{wine.slug}</small>
                </td>
                <td>{new Intl.NumberFormat('vi-VN').format(wine.price)} đ</td>
                <td>
                    {wine.winery_name}<br/>
                    <small>{wine.region_name}</small>
                </td>
                <td>{wine.wine_type}</td>
                <td>
                  <Link to={`/admin/products/${wine.id}`} style={{marginRight: '10px'}}>Sửa</Link>
                  <button onClick={() => handleDelete(wine.id)} style={{color: 'red', border:'none', background:'none', cursor:'pointer'}}>Xóa</button>
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