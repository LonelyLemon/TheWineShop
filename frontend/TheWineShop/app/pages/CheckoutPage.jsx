import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { useCart } from '../context/CartContext';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { refreshCart } = useCart();
  
  const [formData, setFormData] = useState({
    shipping_address: '',
    phone_number: '',
    note: '',
    delivery_mode: 'regular', 
    payment_method: 'cod'
  });

  const [cart, setCart] = useState(null);
  const [simulation, setSimulation] = useState({
    items_total: 0,
    shipping_fee: 0,
    discount_amount: 0,
    final_total: 0
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const formatPrice = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const res = await axiosClient.get('/api/cart');
        if (!res.data || !res.data.items || res.data.items.length === 0) {
            navigate('/cart');
        }
        setCart(res.data);
      } catch (error) {
        console.error("Lỗi tải giỏ hàng", error);
      }
    };
    fetchCart();
  }, [navigate]);

  useEffect(() => {
    const simulateOrder = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.post('/api/cart/simulate', {
            shipping_address: formData.shipping_address || "HCM",
            phone_number: formData.phone_number || "0909090909",
            delivery_mode: formData.delivery_mode,
            payment_method: formData.payment_method,
            coupon_code: null
        });
        setSimulation(res.data);
      } catch (error) {
        console.error("Lỗi tính toán đơn hàng", error);
      } finally {
        setLoading(false);
      }
    };

    simulateOrder();
  }, [formData.delivery_mode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
        const res = await axiosClient.post('/api/cart/orders', formData);
        
        toast.success("Đặt hàng thành công! Mã đơn: " + res.data.id.slice(0,8));
        
        refreshCart();
        
        navigate('/orders'); 

    } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.detail || "Đặt hàng thất bại, vui lòng thử lại.");
    } finally {
        setSubmitting(false);
    }
  };

  if (!cart) return <div className="checkout-loading">Đang tải thông tin...</div>;

  return (
    <div className="checkout-page">
      <h1 className="checkout-title">Thanh Toán</h1>

      <div className="checkout-container">
        <div className="checkout-form-section">
            <form id="checkout-form" onSubmit={handleSubmit}>
                <h3 className="section-head">📍 Thông tin giao hàng</h3>
                
                <div className="form-group">
                    <label>Địa chỉ nhận hàng *</label>
                    <input 
                        type="text" 
                        name="shipping_address"
                        value={formData.shipping_address}
                        onChange={handleChange}
                        placeholder="Số nhà, tên đường, phường, quận..."
                        required 
                    />
                </div>

                <div className="form-group">
                    <label>Số điện thoại *</label>
                    <input 
                        type="text" 
                        name="phone_number" 
                        value={formData.phone_number}
                        onChange={handleChange}
                        placeholder="Ví dụ: 0987654321"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Ghi chú đơn hàng (Tùy chọn)</label>
                    <textarea 
                        name="note" 
                        value={formData.note}
                        onChange={handleChange}
                        placeholder="Ví dụ: Giao giờ hành chính..."
                    />
                </div>

                <h3 className="section-head">🚚 Vận chuyển</h3>
                <div className="radio-group">
                    <label className={`radio-card ${formData.delivery_mode === 'regular' ? 'active' : ''}`}>
                        <input 
                            type="radio" 
                            name="delivery_mode" 
                            value="regular" 
                            checked={formData.delivery_mode === 'regular'}
                            onChange={handleChange}
                        />
                        <div className="radio-info">
                            <span>Giao hàng tiêu chuẩn (3-4 ngày)</span>
                            <span className="price-tag">30.000 ₫</span>
                        </div>
                    </label>

                    <label className={`radio-card ${formData.delivery_mode === 'express' ? 'active' : ''}`}>
                        <input 
                            type="radio" 
                            name="delivery_mode" 
                            value="express" 
                            checked={formData.delivery_mode === 'express'}
                            onChange={handleChange}
                        />
                        <div className="radio-info">
                            <span>Giao hàng hỏa tốc (24h)</span>
                            <span className="price-tag">50.000 ₫</span>
                        </div>
                    </label>
                </div>

                <h3 className="section-head">💳 Thanh toán</h3>
                <div className="radio-group">
                    <label className={`radio-card ${formData.payment_method === 'cod' ? 'active' : ''}`}>
                        <input 
                            type="radio" 
                            name="payment_method" 
                            value="cod" 
                            checked={formData.payment_method === 'cod'}
                            onChange={handleChange}
                        />
                        <div className="radio-info">
                            <span>Thanh toán khi nhận hàng (COD)</span>
                        </div>
                    </label>

                    <label className={`radio-card ${formData.payment_method === 'banking' ? 'active' : ''}`}>
                        <input 
                            type="radio" 
                            name="payment_method" 
                            value="banking" 
                            checked={formData.payment_method === 'banking'}
                            onChange={handleChange}
                        />
                        <div className="radio-info">
                            <span>Chuyển khoản ngân hàng</span>
                        </div>
                    </label>
                </div>

            </form>
        </div>

        <div className="checkout-summary-section">
            <div className="order-summary-box">
                <h3>Đơn hàng ({cart.items.length} sản phẩm)</h3>
                
                <div className="summary-items-list">
                    {cart.items.map(item => (
                        <div key={item.id} className="summary-item">
                            <div className="summary-item-info">
                                <span className="item-qty">{item.quantity}x</span>
                                <span className="item-name">{item.wine.name}</span>
                            </div>
                            <span className="item-price">{formatPrice(item.subtotal)}</span>
                        </div>
                    ))}
                </div>

                <div className="summary-divider"></div>

                <div className="summary-row">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(simulation.items_total)}</span>
                </div>
                <div className="summary-row">
                    <span>Phí vận chuyển:</span>
                    <span>{formatPrice(simulation.shipping_fee)}</span>
                </div>
                
                {simulation.discount_amount > 0 && (
                     <div className="summary-row discount">
                        <span>Giảm giá:</span>
                        <span>-{formatPrice(simulation.discount_amount)}</span>
                    </div>
                )}

                <div className="summary-divider"></div>

                <div className="summary-row total">
                    <span>Tổng cộng:</span>
                    <span className="total-price">{formatPrice(simulation.final_total)}</span>
                </div>

                <button 
                    type="submit" 
                    form="checkout-form"
                    className="place-order-btn"
                    disabled={loading || submitting}
                >
                    {submitting ? "Đang xử lý..." : "ĐẶT HÀNG"}
                </button>

                <Link to="/cart" className="back-to-cart">
                    ← Quay lại giỏ hàng
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;