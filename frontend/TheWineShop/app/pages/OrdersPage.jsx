import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axiosClient.get('/api/cart/orders');
        setOrders(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const getStatusColor = (status) => {
      switch(status) {
          case 'pending': return 'orange';
          case 'shipping': return 'blue';
          case 'completed': return 'green';
          case 'cancelled': return 'red';
          default: return 'gray';
      }
  };

  const getDeliveryLabel = (mode) => {
      switch(mode) {
          case 'express': return 'Hỏa tốc';
          case 'sea': return 'Đường biển';
          default: return 'Tiêu chuẩn';
      }
  };

  if (loading) return <div className="loading-center">Đang tải lịch sử...</div>;

  return (
    <div className="container orders-page">
      <h1>Lịch sử đơn hàng</h1>
      {orders.length === 0 ? (
          <p>Bạn chưa có đơn hàng nào.</p>
      ) : (
          <div className="orders-list">
              {orders.map(order => (
                  <div key={order.id} className="order-card">
                      <div className="order-header">
                          <div>
                              <span className="order-id">Đơn hàng #{order.id.slice(0, 8)}...</span>
                              <span className="order-date">{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <span className="order-status" style={{color: getStatusColor(order.status)}}>
                              {order.status.toUpperCase()}
                          </span>
                      </div>

                      <div className="order-items">
                          {order.items.map(item => (
                              <div key={item.id} className="order-item">
                                  <img src={item.wine.thumbnail || "https://via.placeholder.com/50"} alt={item.wine.name} />
                                  <div className="item-details">
                                      <span className="item-name">{item.wine.name}</span>
                                      <span className="item-qty">x{item.quantity}</span>
                                  </div>
                                  <span className="item-price">{formatPrice(item.price_at_purchase * item.quantity)}</span>
                              </div>
                          ))}
                      </div>

                      <div className="order-footer">
                          <div className="order-summary-row">
                              <span>Phương thức vận chuyển:</span>
                              <strong>{getDeliveryLabel(order.delivery_mode)}</strong>
                          </div>
                          <div className="order-summary-row">
                              <span>Phí giao hàng:</span>
                              <span>{formatPrice(order.delivery_cost)}</span>
                          </div>
                          <div className="order-total">
                              <span>Tổng cộng:</span>
                              <span className="total-price">{formatPrice(order.total_amount)}</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default OrdersPage;