import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [discountInfo, setDiscountInfo] = useState({ amount: 0, appliedCode: null });
  const [finalTotal, setFinalTotal] = useState(0);

  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    phone: '',
    note: '',
    payment_method: 'cod',
    delivery_mode: 'regular'
  });

  const getShippingFee = (mode) => {
    switch (mode) {
        case 'express': return 50000;
        case 'sea': return 20000;
        default: return 30000;
    }
  };

  useEffect(() => {
    const initData = async () => {
      try {
        const cartRes = await axiosClient.get('/api/cart');
        if (!cartRes.data.items || cartRes.data.items.length === 0) {
            toast.info("Giỏ hàng trống");
            navigate('/');
            return;
        }
        setCart(cartRes.data);

        try {
            const userRes = await axiosClient.get('/api/users/me');
            const u = userRes.data;
            const fullAddress = [u.address_line_1, u.city, u.country].filter(Boolean).join(', ');
            
            setShippingInfo(prev => ({
                ...prev,
                address: fullAddress || '',
                phone: u.phone_number || ''
            }));
        // eslint-disable-next-line no-unused-vars
        } catch (e) {
            // Chưa login
        }

        const fee = getShippingFee('regular');
        setFinalTotal(cartRes.data.total_price + fee);

      } catch (error) {
         if (error.response?.status === 401) {
             toast.warning("Vui lòng đăng nhập để thanh toán");
             navigate('/login');
         } else {
             console.error(error);
         }
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [navigate]);

  const calculateTotal = async (code = null, currentDeliveryMode = null) => {
      const mode = currentDeliveryMode || shippingInfo.delivery_mode;
      
      try {
          const payload = {
              shipping_address: shippingInfo.address || 'temp', 
              phone_number: shippingInfo.phone || '000',
              delivery_mode: mode,
              coupon_code: code
          };
          
          const res = await axiosClient.post('/api/cart/simulate', payload);
          
          setDiscountInfo({
              amount: res.data.discount_amount,
              appliedCode: res.data.coupon_applied
          });
          setFinalTotal(res.data.final_total);
          
          return res.data;
      } catch (error) {
          console.error("Lỗi tính giá:", error);
          return null;
      }
  };

  useEffect(() => {
      if (cart) {
          calculateTotal(discountInfo.appliedCode || couponCode, shippingInfo.delivery_mode);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shippingInfo.delivery_mode]);

  const handleApplyCoupon = async () => {
      if (!couponCode.trim()) return;
      
      const res = await calculateTotal(couponCode, shippingInfo.delivery_mode);
      
      if (res && res.coupon_applied) {
          toast.success(`Đã áp dụng mã: ${res.coupon_applied}`);
      } else {
          toast.error("Mã giảm giá không hợp lệ hoặc không đủ điều kiện");
          setDiscountInfo({ amount: 0, appliedCode: null });
          calculateTotal(null, shippingInfo.delivery_mode);
      }
  };

  const handleOrder = async () => {
    if (!shippingInfo.address || !shippingInfo.phone) {
        toast.warning("Vui lòng nhập địa chỉ và số điện thoại");
        return;
    }

    setSubmitting(true);
    try {
      const payload = {
          shipping_address: shippingInfo.address,
          phone_number: shippingInfo.phone,
          note: shippingInfo.note,
          payment_method: shippingInfo.payment_method,
          delivery_mode: shippingInfo.delivery_mode,
          coupon_code: discountInfo.appliedCode
      };

      await axiosClient.post('/api/cart/orders', payload);
      toast.success("Đặt hàng thành công!");
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi đặt hàng");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-container">Đang tải...</div>;

  const currentShippingFee = getShippingFee(shippingInfo.delivery_mode);

  return (
    <div className="checkout-container">
      <h1>Thanh toán</h1>
      
      <div className="checkout-grid">
        <div className="checkout-form">
            <h3>Thông tin giao hàng</h3>
            <div className="form-group">
                <label>Địa chỉ nhận hàng</label>
                <input 
                    type="text" 
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                    placeholder="Số nhà, đường, phường/xã..."
                />
            </div>
            <div className="form-group">
                <label>Số điện thoại</label>
                <input 
                    type="text" 
                    value={shippingInfo.phone}
                    onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                />
            </div>
            
            <div className="form-group">
                <label>Phương thức vận chuyển</label>
                <div className="delivery-options">
                    <label className={`delivery-option ${shippingInfo.delivery_mode === 'regular' ? 'selected' : ''}`}>
                        <input 
                            type="radio" 
                            name="delivery" 
                            value="regular"
                            checked={shippingInfo.delivery_mode === 'regular'}
                            onChange={(e) => setShippingInfo({...shippingInfo, delivery_mode: e.target.value})}
                        />
                        <span>Tiêu chuẩn (30k)</span>
                    </label>
                    <label className={`delivery-option ${shippingInfo.delivery_mode === 'express' ? 'selected' : ''}`}>
                        <input 
                            type="radio" 
                            name="delivery" 
                            value="express"
                            checked={shippingInfo.delivery_mode === 'express'}
                            onChange={(e) => setShippingInfo({...shippingInfo, delivery_mode: e.target.value})}
                        />
                        <span>Hỏa tốc (50k)</span>
                    </label>
                    <label className={`delivery-option ${shippingInfo.delivery_mode === 'sea' ? 'selected' : ''}`}>
                        <input 
                            type="radio" 
                            name="delivery" 
                            value="sea"
                            checked={shippingInfo.delivery_mode === 'sea'}
                            onChange={(e) => setShippingInfo({...shippingInfo, delivery_mode: e.target.value})}
                        />
                        <span>Đường biển (20k)</span>
                    </label>
                </div>
            </div>

            <div className="form-group">
                <label>Ghi chú</label>
                <textarea 
                    value={shippingInfo.note}
                    onChange={(e) => setShippingInfo({...shippingInfo, note: e.target.value})}
                />
            </div>
        </div>

        <div className="order-summary">
            <h3>Đơn hàng của bạn</h3>
            <div className="summary-items">
                {cart && cart.items.map(item => (
                    <div key={item.id} className="summary-item">
                        <span>{item.wine.name} (x{item.quantity})</span>
                        <span>{new Intl.NumberFormat('vi-VN').format(item.subtotal)} đ</span>
                    </div>
                ))}
            </div>
            <div className="summary-divider"></div>
            
            <div className="coupon-section" style={{display: 'flex', gap: '5px', marginBottom: '15px'}}>
                <input 
                    type="text" 
                    placeholder="Mã giảm giá" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px'}}
                />
                <button 
                    onClick={handleApplyCoupon}
                    style={{padding: '8px 15px', background: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'}}
                >
                    Áp dụng
                </button>
            </div>

            <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{cart ? new Intl.NumberFormat('vi-VN').format(cart.total_price) : 0} đ</span>
            </div>
            <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{new Intl.NumberFormat('vi-VN').format(currentShippingFee)} đ</span>
            </div>

            {discountInfo.amount > 0 && (
                <div className="summary-row" style={{color: 'green', fontWeight: 'bold'}}>
                    <span>Giảm giá ({discountInfo.appliedCode}):</span>
                    <span>- {new Intl.NumberFormat('vi-VN').format(discountInfo.amount)} đ</span>
                </div>
            )}
            
            <div className="summary-divider"></div>

            <div className="summary-row total">
                <span>Tổng cộng:</span>
                <span>{new Intl.NumberFormat('vi-VN').format(finalTotal)} đ</span>
            </div>

            <button 
                className="confirm-btn"
                onClick={handleOrder}
                disabled={submitting}
            >
                {submitting ? 'Đang xử lý...' : 'ĐẶT HÀNG'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;