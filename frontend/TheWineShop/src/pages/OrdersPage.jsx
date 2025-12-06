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
  const formatDate = (dateString) => new Date(dateString).toLocaleString('vi-VN');

  if (loading) return <div className="loading-center">Đang tải lịch sử...</div>;

  return (
    <div className="orders-page-container">
      <h1>Lịch sử đơn hàng</h1>
      
      {orders.length === 0 ? (
          <p className="no-orders">Bạn chưa có đơn hàng nào.</p>
      ) : (
          <div className="orders-list">
              {orders.map(order => (
                  <div key={order.id} className="order-card">
                      <div className="order-header">
                          <div className="order-info-left">
                              <div className="order-id"><strong>Mã đơn:</strong> #{order.id.slice(0, 8)}</div>
                              <div className="order-date">{formatDate(order.created_at)}</div>
                          </div>
                          
                          <div className="order-info-right">
                              <span className={`order-status-badge status-${order.status}`}>
                                  {order.status}
                              </span>
                              <span className="order-total-price">
                                  {formatPrice(order.total_amount)}
                              </span>
                          </div>
                      </div>
                      
                      <div className="order-items-list">
                          {order.items.map((item, index) => (
                              <div key={index} className="order-item-row">
                                  <span>• {item.wine.name} <strong>(x{item.quantity})</strong></span>
                                  <span>{formatPrice(item.price_at_purchase)}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};

export default OrdersPage;