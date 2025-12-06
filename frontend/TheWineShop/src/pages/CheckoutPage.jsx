import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [formData, setFormData] = useState({
    address: '',
    phone: '',
    note: '',
    payment_method: 'cod'
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await axiosClient.get('/api/cart');
        if (response.data.items.length === 0) {
            toast.error("Giỏ hàng trống!");
            navigate('/cart');
        }
        setCart(response.data);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    fetchCart();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      const payload = {
        shipping_address: formData.address,
        phone_number: formData.phone,
        note: formData.note,
        payment_method: formData.payment_method
      };

      await axiosClient.post('/api/cart/orders', payload);
      
      toast.success("Đặt hàng thành công! Cảm ơn bạn.");
      
      navigate('/orders'); 
      
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.detail || "Đặt hàng thất bại.";
      toast.error(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="checkout-container">Đang tải...</div>;

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="checkout-container">
      <h1>Thanh toán đơn hàng</h1>
      
      <div className="checkout-wrapper">
        <div className="checkout-form-section">
          <h3>Thông tin giao hàng</h3>
          <form id="checkout-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Địa chỉ nhận hàng (*)</label>
              <input 
                type="text" 
                name="address" 
                required 
                placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Số điện thoại (*)</label>
              <input 
                type="text" 
                name="phone" 
                required 
                placeholder="Ví dụ: 0987..."
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Ghi chú đơn hàng</label>
              <textarea 
                name="note" 
                rows="3"
                placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
                value={formData.note}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="form-group">
                <label>Phương thức thanh toán</label>
                <select name="payment_method" value={formData.payment_method} onChange={handleChange}>
                    <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                    <option value="banking">Chuyển khoản ngân hàng</option>
                </select>
            </div>
          </form>
        </div>

        <div className="checkout-summary-section">
          <h3>Đơn hàng của bạn</h3>
          <div className="summary-items">
             {cart.items.map(item => (
                 <div key={item.id} className="summary-item-row">
                     <span>{item.wine.name} (x{item.quantity})</span>
                     <span>{formatPrice(item.subtotal)}</span>
                 </div>
             ))}
          </div>
          <div className="summary-total">
            <span>Tổng cộng</span>
            <span>{formatPrice(cart.total_price)}</span>
          </div>

          <button 
            type="submit" 
            form="checkout-form" 
            className="place-order-btn"
            disabled={processing}
          >
            {processing ? 'Đang xử lý...' : 'Xác nhận đặt hàng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;