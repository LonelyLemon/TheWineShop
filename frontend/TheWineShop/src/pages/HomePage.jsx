import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import ProductCard from '../components/ProductCard';
import { Link } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import './HomePage.css';

const HomePage = () => {
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWines = async () => {
      try {
        const response = await axiosClient.get('/api/products/wines?limit=8');
        setWines(response.data);
      } catch (error) {
        console.error("Failed to fetch wines", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWines();
  }, []);

  return (
    <div className="homepage">
      <section className="hero-banner">
        <div className="hero-content">
          <h1>Tinh Hoa Rượu Vang Thế Giới</h1>
          <p>Khám phá bộ sưu tập rượu vang thượng hạng được tuyển chọn kỹ lưỡng.</p>
          <button className="hero-btn">Khám Phá Ngay</button>
        </div>
      </section>

      <section className="container section-products">
        <h2 className="section-title">Sản Phẩm Nổi Bật</h2>
        
        {loading ? (
          <div className="product-grid">
             {[...Array(8)].map((_, index) => (
                 <Skeleton key={index} type="product-card" />
             ))}
          </div>
        ) : (
          <div className="product-grid">
            {wines.map(wine => (
              <ProductCard key={wine.id} product={wine} />
            ))}
          </div>
        )}
        
        {wines.length === 0 && !loading && (
            <p style={{textAlign: 'center'}}>Chưa có sản phẩm nào.</p>
        )}
      </section>
    </div>
  );
};

export default HomePage;