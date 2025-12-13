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
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Không thể tải danh sách đơn hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
      try {
          await axiosClient.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
          toast.success("Cập nhật trạng thái thành công");
          fetchOrders();
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
          toast.error("Lỗi cập nhật trạng thái");
      }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  const getDeliveryBadge = (mode) => {
      const styles = {
          express: { background: '#ff4d4f', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' },
          sea: { background: '#1890ff', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' },
          regular: { background: '#52c41a', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }
      };
      const labels = { express: 'Hỏa tốc', sea: 'Đường biển', regular: 'Tiêu chuẩn' };
      return <span style={styles[mode] || styles.regular}>{labels[mode] || mode}</span>;
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="admin-container">
      <h1>Quản lý Đơn hàng</h1>
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã đơn / Ngày</th>
              <th>Khách hàng</th>
              <th>Giao hàng & Địa chỉ</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>
                    <strong>#{order.id.slice(0,8)}</strong>
                    <br/>
                    <small>{new Date(order.created_at).toLocaleDateString('vi-VN')}</small>
                </td>
                <td>
                    {order.items[0]?.wine?.name ? (
                        <>
                            {order.items[0].wine.name} <br/>
                            {order.items.length > 1 && <small style={{color: '#888'}}>+ {order.items.length - 1} sản phẩm khác</small>}
                        </>
                    ) : "---"}
                    <div style={{marginTop: '5px', fontSize: '12px'}}>
                        Khách: {order.phone_number}
                    </div>
                </td>
                
                <td style={{maxWidth: '300px'}}>
                    <div style={{marginBottom: '5px'}}>
                        {getDeliveryBadge(order.delivery_mode)} - Phí: {formatPrice(order.delivery_cost)}
                    </div>
                    <div style={{fontSize: '13px', lineHeight: '1.4'}}>
                        📍 {order.shipping_address}
                    </div>
                    {order.note && <div style={{fontSize: '12px', fontStyle: 'italic', color: '#d46b08', marginTop: '3px'}}>📝 Note: {order.note}</div>}
                </td>

                <td>
                    <strong>{formatPrice(order.total_amount)}</strong>
                    <br/>
                    <small>{order.payment_method.toUpperCase()}</small>
                </td>
                
                <td>
                    <select 
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`status-select status-${order.status}`}
                    >
                        <option value="pending">Chờ xác nhận</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="shipping">Đang giao</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Hủy đơn</option>
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