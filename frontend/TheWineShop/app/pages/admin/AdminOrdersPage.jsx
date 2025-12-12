import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './AdminOrdersPage.css';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      const response = await axiosClient.get('/api/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status === 403) {
        toast.error("Bạn không có quyền truy cập trang này!");
        navigate('/');
      } else {
        toast.error("Lỗi khi tải danh sách đơn hàng");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axiosClient.put(`/api/admin/orders/${orderId}/status`, {
        status: newStatus
      });
      
      toast.success(`Đã cập nhật trạng thái thành: ${newStatus}`);
      
      fetchOrders(); 
      
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Cập nhật thất bại");
    }
  };

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN');

  const STATUS_OPTIONS = [
    { value: 'pending', label: 'Chờ xử lý', color: '#ffc107' },
    { value: 'confirmed', label: 'Đã xác nhận', color: '#17a2b8' },
    { value: 'shipping', label: 'Đang giao', color: '#007bff' },
    { value: 'completed', label: 'Hoàn thành', color: '#28a745' },
    { value: 'cancelled', label: 'Đã hủy', color: '#dc3545' },
  ];

  if (loading) return <div className="admin-loading">Đang tải dữ liệu quản trị...</div>;

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Quản lý Đơn hàng (Admin)</h1>
        <button className="refresh-btn" onClick={fetchOrders}>🔄 Làm mới</button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái hiện tại</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>
                    <span className="order-uuid" title={order.id}>#{order.id.slice(0, 8)}</span>
                    <br/>
                    <small>{order.items.length} sản phẩm</small>
                </td>
                <td>
                    {order.phone_number} <br/>
                    <small className="text-muted">{order.shipping_address}</small>
                </td>
                <td>{formatDate(order.created_at)}</td>
                <td style={{fontWeight: 'bold', color: '#800020'}}>{formatPrice(order.total_amount)}</td>
                <td>
                   <span 
                      className="status-badge-admin"
                      style={{
                          backgroundColor: STATUS_OPTIONS.find(s => s.value === order.status)?.color || '#ccc'
                      }}
                   >
                      {STATUS_OPTIONS.find(s => s.value === order.status)?.label || order.status}
                   </span>
                </td>
                <td>
                  <select 
                    className="status-select"
                    value={order.status}
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrdersPage;