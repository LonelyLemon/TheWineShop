import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useCart } from '../context/CartContext';
import { toast } from 'react-toastify';
import ReviewSection from '../components/ReviewSection';
import ProductCard from '../components/ProductCard';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const { refreshCart } = useCart();
  
  const [wine, setWine] = useState(null);
  const [relatedWines, setRelatedWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentUser, setCurrentUser] = useState(null);
  
  const formatPrice = (price) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const res = await axiosClient.get('/api/users/me');
            setCurrentUser(res.data);
        // eslint-disable-next-line no-unused-vars
        } catch (e) { 
          /* Chưa login */ 
        }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axiosClient.get(`/api/products/wines/${id}`);
        setWine(res.data);
        
        if (res.data.category) {
            const relatedRes = await axiosClient.get(
                `/api/products/wines?category_id=${res.data.category.id}&limit=4`
            );
            setRelatedWines(relatedRes.data.filter(w => w.id !== res.data.id).slice(0, 4));
        }
      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    window.scrollTo(0, 0);
  }, [id]);

  const handleAddToCart = async () => {
    try {
        await axiosClient.post('/api/cart/items', {
            wine_id: wine.id,
            quantity: quantity
        });
        toast.success(`Đã thêm ${quantity} chai vào giỏ hàng!`);
        refreshCart();
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
        toast.error("Lỗi thêm vào giỏ hàng");
    }
  };

  if (loading) return <div className="loading-container">Đang tải sản phẩm...</div>;
  if (!wine) return <div className="error-container">Không tìm thấy sản phẩm!</div>;

  return (
    <div className="product-detail-page">
        <div className="detail-container">
            <div className="detail-image-box">
                <img 
                    src={wine.images?.[0]?.image_url || "https://via.placeholder.com/400x600"} 
                    alt={wine.name} 
                    className="detail-image"
                />
            </div>

            <div className="detail-info-box">
                <div className="detail-breadcrumbs">
                    <Link to="/products">Sản phẩm</Link> / <span>{wine.category?.name}</span>
                </div>
                
                <h1 className="detail-title">{wine.name}</h1>
                
                <div className="detail-meta">
                    <span className="meta-item">Nhà sản xuất: <strong>{wine.winery?.name}</strong></span>
                    <span className="meta-item">Vùng: <strong>{wine.winery?.region?.name}</strong></span>
                </div>

                <div className="detail-price">{formatPrice(wine.price)}</div>

                <p className="detail-description">{wine.description}</p>

                <div className="specs-grid">
                    <div className="spec-item">
                        <span className="spec-label">Độ cồn</span>
                        <span className="spec-value">{wine.alcohol_percentage}%</span>
                    </div>
                    <div className="spec-item">
                        <span className="spec-label">Dung tích</span>
                        <span className="spec-value">{wine.volume} ml</span>
                    </div>
                    <div className="spec-item">
                        <span className="spec-label">Niên vụ</span>
                        <span className="spec-value">{wine.vintage}</span>
                    </div>
                    <div className="spec-item">
                        <span className="spec-label">Giống nho</span>
                        <span className="spec-value">
                            {wine.grapes?.map(g => g.grape_variety.name).join(', ') || 'N/A'}
                        </span>
                    </div>
                </div>

                <div className="detail-actions">
                    <div className="quantity-control">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                        <input type="number" value={quantity} readOnly />
                        <button onClick={() => setQuantity(quantity + 1)}>+</button>
                    </div>
                    
                    <button 
                        className="add-to-cart-btn-large"
                        onClick={handleAddToCart}
                        disabled={wine.inventory_quantity <= 0}
                    >
                        {wine.inventory_quantity > 0 ? "THÊM VÀO GIỎ HÀNG" : "TẠM HẾT HÀNG"}
                    </button>
                </div>
                
                <div className="stock-status">
                    {wine.inventory_quantity > 0 
                        ? `✅ Còn hàng (${wine.inventory_quantity} sản phẩm)` 
                        : "❌ Hết hàng"}
                </div>
            </div>
        </div>

        <ReviewSection wineId={wine.id} user={currentUser} />

        {relatedWines.length > 0 && (
            <div className="related-products-section">
                <h2 className="section-title">Sản phẩm tương tự</h2>
                <div className="product-grid">
                    {relatedWines.map(w => (
                        <ProductCard key={w.id} product={w} />
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default ProductDetailPage;