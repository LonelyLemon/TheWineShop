import React from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <img 
          src={product.thumbnail || "https://via.placeholder.com/300x400?text=No+Image"} 
          alt={product.name} 
          className="product-image"
        />
        {product.wine_type && <span className="product-badge">{product.wine_type}</span>}
      </div>
      
      <div className="product-info">
        <h3 className="product-name" title={product.name}>
          <Link to={`/products/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-origin">
            {product.winery_name} - {product.region_name}
        </p>
        <div className="product-price">{formatPrice(product.price)}</div>
        
        <Link to={`/products/${product.id}`} className="view-btn">
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;