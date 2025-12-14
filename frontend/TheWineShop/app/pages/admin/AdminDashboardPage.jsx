import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Link } from 'react-router-dom';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get('/api/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Lỗi tải thống kê", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div>Đang tải thống kê...</div>;
  if (!stats) return <div>Không có dữ liệu.</div>;

  return (
    <div className="admin-container">
      <h1>Tổng quan (Dashboard)</h1>
      
      <div className="stats-grid">
        <div className="stat-card blue">
            <h3>Doanh thu (Đã hoàn thành)</h3>
            <div className="stat-value">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}</div>
            <div className="stat-desc">Tổng thu nhập thực tế</div>
        </div>

        <div className="stat-card orange">
            <h3>Đơn hàng cần xử lý</h3>
            <div className="stat-value">{stats.pending_orders}</div>
            <div className="stat-desc">Trên tổng {stats.total_orders} đơn</div>
            <Link to="/admin/orders" className="stat-link">Xem ngay &rarr;</Link>
        </div>

        <div className="stat-card green">
            <h3>Khách hàng</h3>
            <div className="stat-value">{stats.total_customers}</div>
            <div className="stat-desc">Người dùng đã đăng ký</div>
        </div>

        <div className="stat-card red">
            <h3>Cảnh báo Kho</h3>
            <div className="stat-value">{stats.low_stock_count}</div>
            <div className="stat-desc">Sản phẩm sắp hết hàng (&lt;10)</div>
        </div>
      </div>

      {stats.low_stock_count > 0 && (
          <div className="dashboard-section">
              <h2>⚠️ Sản phẩm sắp hết hàng</h2>
              <table className="admin-table">
                  <thead>
                      <tr>
                          <th>Tên sản phẩm</th>
                          <th>Tồn kho hiện tại</th>
                          <th>Hành động</th>
                      </tr>
                  </thead>
                  <tbody>
                      {stats.low_stock_details.map((item, idx) => (
                          <tr key={idx}>
                              <td>{item.name}</td>
                              <td style={{color: 'red', fontWeight: 'bold'}}>{item.stock}</td>
                              <td>
                                  <Link to="/admin/inventory">Nhập kho</Link>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;