import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './ProductDetailPage.css';
import { useCart } from '../context/CartContext';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const { refreshCart } = useCart();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await axiosClient.get(`/api/products/wines/${id}`);
        setProduct(response.data);
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        toast.error("Không tìm thấy sản phẩm!");
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleAddToCart = async () => {
    if (!localStorage.getItem('access_token')) {
        toast.info("Vui lòng đăng nhập để mua hàng");
        navigate('/login');
        return;
    }

    setAdding(true);
    try {
        await axiosClient.post('/api/cart/items', {
            wine_id: product.id,
            quantity: 1
        });
        toast.success("Đã thêm vào giỏ hàng!");

        refreshCart();
        
    } catch (error) {
        console.error(error);
        toast.error("Có lỗi xảy ra khi thêm vào giỏ");
    } finally {
        setAdding(false);
    }
  };

  if (loading) return <div className="loading-container">Đang tải...</div>;
  if (!product) return <div className="error-container">Sản phẩm không tồn tại.</div>;

  const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);

  const grapeList = product.grapes && product.grapes.length > 0 
    ? product.grapes.map(g => `${g.grape_variety.name} (${g.percentage}%)`).join(', ')
    : 'Chưa cập nhật';

  return (
    <div className="container product-detail-page">
      <Link to="/" className="back-link">← Quay lại trang chủ</Link>
      
      <div className="detail-wrapper">
        <div className="detail-images">
          <div className="main-image">
            <img 
              src={product.images.length > 0 ? product.images[0].image_url : "https://via.placeholder.com/500x600"} 
              alt={product.name} 
            />
          </div>
        </div>

        <div className="detail-info">
          <h1 className="detail-name">{product.name}</h1>
          <div className="detail-meta">
            <span> Nhà sản xuất: <strong>{product.winery?.name}</strong></span> | 
            <span> Vùng: <strong>{product.winery?.region?.name}</strong></span> |
            <span> Niên vụ: <strong>{product.vintage}</strong></span>
          </div>
          
          <div className="detail-price">{price}</div>
          
          <div className="detail-description">
            <h3>Mô tả hương vị</h3>
            <p>{product.description}</p>
          </div>

          <div className="detail-specs">
            <p><strong>Giống nho:</strong> {grapeList}</p>
            <p><strong>Nồng độ:</strong> {product.alcohol_percentage}%</p>
            <p><strong>Dung tích:</strong> {product.volume}ml</p>
            <p><strong>Loại vang:</strong> {product.category?.name}</p>
            <p><strong>Tồn kho:</strong> {product.inventory_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}</p>
          </div>

          <div className="detail-actions">
            <button 
                className="add-to-cart-btn" 
                disabled={product.inventory_quantity === 0 || adding}
                onClick={handleAddToCart}
            >
              {adding ? 'Đang xử lý...' : (product.inventory_quantity > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;