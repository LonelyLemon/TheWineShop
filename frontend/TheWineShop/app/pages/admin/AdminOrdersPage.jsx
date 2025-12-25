import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import './AdminOrdersPage.css';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await axiosClient.get('/api/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
      const originalOrders = [...orders];
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

      try {
          await axiosClient.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
          toast.success("Cập nhật trạng thái thành công");
          fetchOrders();
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
          setOrders(originalOrders);
          toast.error("Lỗi cập nhật trạng thái");
      }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getStatusColor = (status) => {
    switch(status) {
        case 'pending': return 'orange';
        case 'confirmed': return 'blue';
        case 'shipping': return '#17a2b8';
        case 'completed': return 'green';
        case 'cancelled': return 'red';
        default: return 'gray';
    }
  };

  if (loading) return <div className="p-4">Đang tải dữ liệu đơn hàng...</div>;

  return (
    <div className="admin-page-container">
      <h2 className="admin-title">Quản lý Đơn hàng</h2>
       
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã ĐH</th>
              <th>Khách hàng</th>
              <th>Ngày đặt</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
                <tr><td colSpan="6" className="text-center">Chưa có đơn hàng nào</td></tr>
            )}
            {orders.map(order => (
              <tr key={order.id}>
                <td title={order.id}>#{order.id.slice(0, 8)}</td>
                <td>
                    <div className="fw-bold">{order.shipping_address}</div>
                    <div className="text-muted small">{order.phone_number}</div>
                </td>
                <td>{new Date(order.created_at).toLocaleDateString('vi-VN')}</td>
                <td className="fw-bold text-primary">{formatPrice(order.total_amount)}</td>
                <td>
                    <span 
                        className="badge" 
                        style={{
                            backgroundColor: getStatusColor(order.status), 
                            color: 'white', 
                            padding: '5px 10px', 
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                            fontSize: '0.8rem'
                        }}
                    >
                      {order.status}
                    </span>
                </td>
                <td>
                  <select 
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="status-select"
                      disabled={order.status === 'cancelled' || order.status === 'completed'}
                      style={{padding: '5px', borderRadius: '4px', border: '1px solid #ccc'}}
                  >
                      <option value="pending">Chờ xử lý (Pending)</option>
                      <option value="confirmed">Đã xác nhận (Confirmed)</option>
                      <option value="shipping">Đang giao (Shipping)</option>
                      <option value="completed">Hoàn thành (Completed)</option>
                      <option value="cancelled">Hủy đơn (Cancelled)</option>
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