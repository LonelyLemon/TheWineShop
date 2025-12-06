import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const response = await axiosClient.get('/api/cart');
      setCart(response.data);
    } catch (error) {
      console.error("Lỗi lấy giỏ hàng", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleRemove = async (wineId) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) return;

    try {
      await axiosClient.delete(`/api/cart/items/${wineId}`);
      toast.success("Đã xóa sản phẩm");
      fetchCart();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      toast.error("Lỗi khi xóa sản phẩm");
    }
  };

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  if (loading) return <div className="cart-container">Đang tải giỏ hàng...</div>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="cart-container empty-cart">
        <h2>Giỏ hàng của bạn đang trống</h2>
        <Link to="/" className="continue-shopping">Mua sắm ngay</Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1>Giỏ hàng của bạn</h1>
      
      <div className="cart-content">
        <div className="cart-items">
          <table className="cart-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Tạm tính</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.items.map((item) => (
                <tr key={item.id}>
                  <td className="item-info">
                    <img 
                        src={item.wine.thumbnail || "https://via.placeholder.com/80"} 
                        alt={item.wine.name} 
                        className="item-thumb"
                    />
                    <div>
                        <Link to={`/products/${item.wine.id}`} className="item-name">
                            {item.wine.name}
                        </Link>
                    </div>
                  </td>
                  <td>{formatPrice(item.wine.price)}</td>
                  <td>
                    <span className="qty-badge">{item.quantity}</span>
                  </td>
                  <td className="item-subtotal">{formatPrice(item.subtotal)}</td>
                  <td>
                    <button 
                        className="remove-btn"
                        onClick={() => handleRemove(item.wine.id)}
                    >
                        🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="cart-summary">
          <h3>Tổng đơn hàng</h3>
          <div className="summary-row">
            <span>Tạm tính:</span>
            <span>{formatPrice(cart.total_price)}</span>
          </div>
          <div className="summary-row total">
            <span>Tổng cộng:</span>
            <span>{formatPrice(cart.total_price)}</span>
          </div>
          
          <button 
            className="checkout-btn"
            onClick={() => navigate('/checkout')}
          >
            Tiến hành thanh toán
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;