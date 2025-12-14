import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { refreshCart } = useCart();
  const [adding, setAdding] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const renderStars = (rating) => {
    return "★".repeat(Math.floor(rating)) + "☆".repeat(5 - Math.floor(rating));
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await axiosClient.post('/api/cart/items', {
        wine_id: product.id,
        quantity: 1
      });
      toast.success(`Đã thêm "${product.name}" vào giỏ!`);
      refreshCart();
    } catch (error) {
      toast.error("Lỗi khi thêm vào giỏ hàng");
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <div className="product-badges">
           {product.wine_type && <span className="badge badge-type">{product.wine_type}</span>}
        </div>
        
        <Link to={`/products/${product.id}`}>
          <img 
            src={product.thumbnail || "https://via.placeholder.com/300x400?text=No+Image"} 
            alt={product.name} 
            className="product-image"
          />
        </Link>
      </div>
      
      <div className="product-info">
        <div className="product-meta">
            {product.winery_name} • {product.region_name}
        </div>

        <h3 className="product-name" title={product.name}>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        
        <div className="product-rating">
            <span className="stars">{renderStars(product.average_rating || 0)}</span>
            <span className="review-count">({product.review_count} đánh giá)</span>
        </div>

        <div className="card-footer">
            <div className="price-box">
                <span className="price">{formatPrice(product.price)}</span>
            </div>
            
            <button 
                className="add-btn" 
                onClick={handleAddToCart} 
                disabled={adding}
                title="Thêm nhanh vào giỏ"
            >
                {adding ? "..." : "+"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;