import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import ProductCard from '../components/ProductCard';
import Skeleton from '../components/Skeleton';
import './ProductsPage.css';

const ProductsPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchTerm = searchParams.get('search');

  const [wines, setWines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axiosClient.get('/api/products/categories');
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi lấy danh mục", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchWines = async () => {
      setLoading(true);
      try {
        let query = `/api/products/wines?limit=20&sort_by=${sortBy}`;
        
        if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
        if (selectedCategory) query += `&category_id=${selectedCategory}`;
        if (priceRange.min) query += `&min_price=${priceRange.min}`;
        if (priceRange.max) query += `&max_price=${priceRange.max}`;

        const response = await axiosClient.get(query);
        setWines(response.data);
      } catch (error) {
        console.error("Failed to fetch wines", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWines();
  }, [searchTerm, selectedCategory, sortBy, priceRange.min, priceRange.max]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
  };

  return (
    <div className="products-page">
      
      <div className="products-header">
        <div>
          <h2>{searchTerm ? `Kết quả tìm kiếm: "${searchTerm}"` : 'Tất cả sản phẩm'}</h2>
          <span className="products-count">{wines.length} sản phẩm</span>
        </div>
        
        <select 
          className="sort-select" 
          value={sortBy} 
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="newest">Mới nhất</option>
          <option value="price_asc">Giá: Thấp đến Cao</option>
          <option value="price_desc">Giá: Cao đến Thấp</option>
          <option value="name_asc">Tên: A-Z</option>
        </select>
      </div>

      <div className="products-layout">
        
        <aside className="products-sidebar">
            <div className="filter-group">
                <span className="filter-title">Danh mục</span>
                <ul className="category-list">
                    <li 
                        className={`category-item ${!selectedCategory ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        Tất cả
                    </li>
                    {categories.map(cat => (
                        <li 
                            key={cat.id} 
                            className={`category-item ${selectedCategory === cat.id ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(cat.id)}
                        >
                            {cat.name}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="filter-group">
                <span className="filter-title">Khoảng giá (VNĐ)</span>
                <div className="price-range-inputs">
                    <input 
                        type="number" 
                        placeholder="Min" 
                        className="price-input"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    />
                    <span>-</span>
                    <input 
                        type="number" 
                        placeholder="Max" 
                        className="price-input"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    />
                </div>
            </div>

            <button className="filter-btn" onClick={clearFilters}>
                Xóa bộ lọc
            </button>
        </aside>

        <main className="products-grid-container">
          {loading ? (
             <div className="product-grid">
               {[...Array(6)].map((_, index) => <Skeleton key={index} type="product-card" />)}
             </div>
          ) : (
            <>
                <div className="product-grid">
                    {wines.map(wine => (
                        <ProductCard key={wine.id} product={wine} />
                    ))}
                </div>
                {wines.length === 0 && (
                    <div style={{textAlign: 'center', padding: '50px'}}>
                        <p>Không tìm thấy sản phẩm nào phù hợp.</p>
                        <button 
                            style={{marginTop: '10px', textDecoration: 'underline', background:'none', border:'none', cursor:'pointer'}} 
                            onClick={clearFilters}
                        >
                            Xóa bộ lọc để xem tất cả
                        </button>
                    </div>
                )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default ProductsPage;