import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { Filter, SlidersHorizontal, Search, X, ChevronDown, ShoppingCart, Eye } from 'lucide-react';

const ProductsPage = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';

  // --- STATE ---
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]); 
  
  // --- FILTER STATE ---
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(null); // Lưu slug của category
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('newest');
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Danh mục nhanh ở trên cùng
  const quickCategories = [
    { label: 'Tất cả', value: null },
    { label: 'Vang Đỏ', value: 'vang-do' },
    { label: 'Vang Trắng', value: 'vang-trang' },
    { label: 'Vang Sủi', value: 'vang-sui' },
    { label: 'Bia', value: 'bia' },
    { label: 'Rượu Nền', value: 'ruou-nen' },
  ];

  // 1. Fetch Categories (Dùng cho sidebar nếu có API)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        
        const res = await axiosClient.get('/api/products/categories'); 
        setCategories(res.data);
      } catch (error) {
        
      }
    };
    fetchCategories();
  }, []);

  // 2. Fetch Wines với filters
  useEffect(() => {
    const fetchWines = async () => {
      setLoading(true);
      try {
        // Xây dựng Query Params
        const params = new URLSearchParams();
        params.append('limit', 100);
        params.append('sort_by', sortBy);
        
        if (searchTerm) params.append('search', searchTerm);
        if (selectedCategory) params.append('category_slug', selectedCategory); // Backend cần hỗ trợ lọc theo slug
        if (priceRange.min) params.append('min_price', priceRange.min);
        if (priceRange.max) params.append('max_price', priceRange.max);

        // Gọi API đúng
        const res = await axiosClient.get(`/api/products/wines?${params.toString()}`);
        
        // Xử lý dữ liệu trả về (Array hoặc Object có data)
        const data = Array.isArray(res.data) ? res.data : (res.data.data || res.data.items || []);
        setWines(data);

      } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce nhẹ cho search (nếu muốn) hoặc gọi luôn
    const timer = setTimeout(() => {
        fetchWines();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, sortBy, priceRange]); // Bỏ .min .max để đỡ render nhiều lần

  const clearFilters = () => {
    setSelectedCategory(null);
    setPriceRange({ min: '', max: '' });
    setSortBy('newest');
    setSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in-up">
      
      {/* 1. BANNER SECTION */}
      <div className="relative h-[300px] bg-[#2a0a10] overflow-hidden">
        <img 
            src="https://images.unsplash.com/photo-1516594915697-87eb3b1c14ea?q=80&w=2070&auto=format&fit=crop" 
            alt="Wine Banner" 
            className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-serif tracking-wide">
                World Class Cellar
            </h1>
            <p className="text-gray-200 text-lg max-w-2xl">
                Khám phá bộ sưu tập rượu vang và bia thượng hạng từ những vùng đất trứ danh thế giới.
            </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* 2. TOP FILTER BAR (Quick Categories) */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10 border-b border-gray-200 pb-6">
            {quickCategories.map((cat) => (
                <button
                    key={cat.value || 'all'}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200
                        ${selectedCategory === cat.value 
                            ? 'bg-[#800020] text-white shadow-md transform scale-105' 
                            : 'bg-white text-gray-600 border border-gray-200 hover:border-[#800020] hover:text-[#800020]'
                        }
                    `}
                >
                    {cat.label}
                </button>
            ))}
        </div>

        {/* 3. MAIN LAYOUT: SIDEBAR + GRID */}
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* --- SIDEBAR FILTER (Desktop: Sticky, Mobile: Toggle) --- */}
            <aside className={`lg:w-64 shrink-0 space-y-8 ${showMobileFilter ? 'block' : 'hidden lg:block'}`}>
                
                {/* Search Box */}
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm rượu..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020]"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>

                {/* Filter Box */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 text-gray-800 font-bold border-b pb-2">
                        <Filter size={18} /> Bộ lọc
                    </div>
                    
                    {/* Price Range */}
                    <div className="mb-6">
                        <label className="text-sm font-semibold text-gray-600 mb-2 block">Khoảng giá (VNĐ)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                placeholder="Min" 
                                value={priceRange.min}
                                onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#800020]"
                            />
                            <span className="text-gray-400">-</span>
                            <input 
                                type="number" 
                                placeholder="Max" 
                                value={priceRange.max}
                                onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-[#800020]"
                            />
                        </div>
                    </div>

                    {/* Danh mục chi tiết (nếu có từ API) */}
                    {categories.length > 0 && (
                        <div className="mb-6">
                            <label className="text-sm font-semibold text-gray-600 mb-2 block">Danh mục khác</label>
                            <ul className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                                {categories.map((cat) => (
                                    <li key={cat.id}>
                                        <button 
                                            onClick={() => setSelectedCategory(cat.slug)}
                                            className={`text-sm w-full text-left truncate px-2 py-1 rounded hover:bg-red-50 hover:text-[#800020] transition
                                                ${selectedCategory === cat.slug ? 'text-[#800020] font-medium bg-red-50' : 'text-gray-500'}
                                            `}
                                        >
                                            {cat.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <button 
                        onClick={clearFilters}
                        className="w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2"
                    >
                        <X size={16} /> Xóa bộ lọc
                    </button>
                </div>
            </aside>

            {/* --- PRODUCT GRID --- */}
            <main className="flex-1">
                
                {/* Header Sort & Mobile Filter Toggle */}
                <div className="flex justify-between items-center mb-6">
                    <p className="text-gray-500 text-sm">
                        Hiển thị <span className="font-bold text-gray-800">{wines.length}</span> sản phẩm
                    </p>

                    <div className="flex gap-3">
                        <button 
                            className="lg:hidden p-2 bg-white border border-gray-200 rounded-lg text-gray-600"
                            onClick={() => setShowMobileFilter(!showMobileFilter)}
                        >
                            <SlidersHorizontal size={20} />
                        </button>
                        
                        <div className="relative">
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none bg-white border border-gray-200 pl-4 pr-10 py-2 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#800020] cursor-pointer"
                            >
                                <option value="newest">Mới nhất</option>
                                <option value="price_asc">Giá tăng dần</option>
                                <option value="price_desc">Giá giảm dần</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="bg-white rounded-xl h-80 animate-pulse border border-gray-100"></div>
                        ))}
                    </div>
                ) : (
                    <>
                        {wines.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {wines.map((product) => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                                <Search size={48} className="text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-800">Không tìm thấy sản phẩm</h3>
                                <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                                <button 
                                    onClick={clearFilters}
                                    className="px-6 py-2 bg-[#800020] text-white rounded-lg hover:bg-[#600018] transition"
                                >
                                    Xem tất cả
                                </button>
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

// Component ProductCard nhỏ (nếu bạn chưa có component riêng hoặc muốn dùng inline)
const ProductCard = ({ product }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
        <div className="relative h-64 bg-gray-50 overflow-hidden">
            <img 
                src={product.image_url || "https://via.placeholder.com/300?text=Wine"} 
                alt={product.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            {product.stock_quantity === 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold uppercase rounded">Hết hàng</span>
                </div>
            )}
        </div>
        <div className="p-4 flex flex-col flex-1">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
                {product.category?.name || "Premium"}
            </div>
            <h3 className="font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]" title={product.name}>
                {product.name}
            </h3>
            <div className="text-[#800020] font-bold text-lg mb-4">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
            </div>
            
            <div className="mt-auto grid grid-cols-2 gap-2">
                <Link 
                    to={`/products/${product.id}`}
                    className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition"
                >
                    <Eye size={14} /> Chi tiết
                </Link>
                <button 
                    disabled={product.stock_quantity === 0}
                    className="flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white bg-[#800020] rounded hover:bg-[#600018] transition disabled:opacity-50"
                >
                    <ShoppingCart size={14} /> Thêm
                </button>
            </div>
        </div>
    </div>
);

export default ProductsPage;