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

  // State
  const [wines, setWines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');

  // Danh mục menu cứng (theo yêu cầu của bạn)
  const topCategories = [
    { id: 'wine', label: 'Wine', value: 'wine' }, // Bạn cần map value này với ID thật trong DB
    { id: 'champagne', label: 'Champagne & Sparkling', value: 'champagne' },
    { id: 'beers', label: 'Beers', value: 'beer' },
    { id: 'spirits', label: 'Spirits', value: 'spirit' },
  ];

  // Lấy danh mục từ API (để dùng cho Sidebar hoặc mapping)
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

  // Fetch sản phẩm khi bộ lọc thay đổi
  useEffect(() => {
    const fetchWines = async () => {
      setLoading(true);
      try {
        let query = `/api/products/wines?limit=20&sort_by=${sortBy}`;
        
        if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
        
        // Logic lọc theo category (Có thể cần sửa backend để nhận 'type' hoặc map ID)
        if (selectedCategory) {
            // Nếu selectedCategory là số (ID từ DB) hoặc string (từ menu cứng)
            query += `&category_id=${selectedCategory}`; 
        }

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
    <div className="products-page-container">
      
      {/* 1. SECTION BANNER */}
      <div className="products-banner">
        <div className="banner-content">
           <h1>World Class Wines</h1>
           <p>Khám phá hương vị tuyệt hảo từ những vùng đất trứ danh</p>
        </div>
      </div>

      {/* 2. SECTION SUB-MENU (Menu các dòng rượu) */}
      <div className="category-sub-menu">
        <div className="sub-menu-container">
            <button 
                className={`sub-menu-item ${selectedCategory === null ? 'active' : ''}`}
                onClick={() => setSelectedCategory(null)}
            >
                ALL
            </button>
            
            {/* Render các mục bạn yêu cầu */}
            {topCategories.map((cat) => (
                <button
                    key={cat.id}
                    className={`sub-menu-item ${selectedCategory === cat.value ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.value)} // Lưu ý: Backend cần xử lý value này
                >
                    {cat.label.toUpperCase()}
                </button>
            ))}
        </div>
      </div>

      <div className="products-page-content">
        {/* Header đếm số lượng & Sort */}
        <div className="products-header">
            <div>
            <h2>{searchTerm ? `Kết quả: "${searchTerm}"` : 'Danh sách sản phẩm'}</h2>
            <span className="products-count">Tìm thấy {wines.length} sản phẩm</span>
            </div>
            
            <select 
            className="sort-select" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            >
            <option value="newest">Mới nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
        </div>

        <div className="products-layout">
            {/* Sidebar Lọc nâng cao (Giá, Vùng...) */}
            <aside className="products-sidebar">
                <div className="filter-group">
                    <span className="filter-title">Khoảng giá</span>
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
                
                {/* Bạn có thể thêm list Categories chi tiết từ DB ở đây nếu muốn */}
                <div className="filter-group">
                    <span className="filter-title">Chi tiết danh mục</span>
                    <ul className="category-list">
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

                <button className="filter-btn" onClick={clearFilters}>
                    Xóa bộ lọc
                </button>
            </aside>

            {/* Grid Sản phẩm */}
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
                        <div className="no-products">
                            <p>Không tìm thấy sản phẩm nào.</p>
                            <button onClick={clearFilters}>Xem tất cả</button>
                        </div>
                    )}
                </>
            )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;