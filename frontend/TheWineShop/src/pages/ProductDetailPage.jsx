import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="loading-container">Đang tải...</div>;
  if (!product) return <div className="error-container">Sản phẩm không tồn tại.</div>;

  const price = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price);

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
            <span>Xuất xứ: <strong>{product.country}</strong></span> | 
            <span> Vùng: <strong>{product.region}</strong></span> |
            <span> Niên vụ: <strong>{product.vintage}</strong></span>
          </div>
          
          <div className="detail-price">{price}</div>
          
          <div className="detail-description">
            <h3>Mô tả hương vị</h3>
            <p>{product.description}</p>
          </div>

          <div className="detail-specs">
            <p><strong>Nồng độ:</strong> {product.alcohol_percentage}%</p>
            <p><strong>Dung tích:</strong> {product.volume}ml</p>
            <p><strong>Loại vang:</strong> {product.category?.name}</p>
            <p><strong>Tồn kho:</strong> {product.inventory_quantity > 0 ? 'Còn hàng' : 'Hết hàng'}</p>
          </div>

          <div className="detail-actions">
            <button className="add-to-cart-btn" disabled={product.inventory_quantity === 0}>
              {product.inventory_quantity > 0 ? 'Thêm vào giỏ hàng' : 'Hết hàng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;