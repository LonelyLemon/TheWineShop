import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Plus, Search, Edit, Trash2, Filter } from 'lucide-react';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axiosClient.get('/api/products/wines'); // Đảm bảo API này trả về list
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        await axiosClient.delete(`/api/products/${id}`);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        alert("Xóa thất bại");
      }
    }
  };

  // Lọc sản phẩm theo tìm kiếm
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

  return (
    <div>
      {/* HEADER: Tiêu đề + Nút thêm mới */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sản phẩm & Kho</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý danh sách rượu và số lượng tồn kho</p>
        </div>
        <Link to="/admin/products/new" className="bg-[#800020] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#600018] transition shadow-sm">
          <Plus size={18} /> Thêm rượu mới
        </Link>
      </div>

      {/* TOOLBAR: Tìm kiếm */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tên rượu..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-100 focus:border-[#800020]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Bạn có thể thêm Dropdown lọc danh mục ở đây sau này */}
      </div>

      {/* TABLE: Danh sách */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Sản phẩm</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Giá bán</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Tồn kho</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Danh mục</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={product.image_url || 'https://via.placeholder.com/40'} 
                      alt="" 
                      className="w-10 h-10 rounded object-cover border border-gray-200"
                    />
                    <span className="font-medium text-gray-900">{product.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-gray-700">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    product.stock_quantity === 0 
                      ? 'bg-gray-100 text-gray-500' 
                      : product.stock_quantity < 10 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                  }`}>
                    {product.stock_quantity === 0 ? 'Hết hàng' : product.stock_quantity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{product.category || 'Vang đỏ'}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredProducts.length === 0 && (
          <div className="p-8 text-center text-gray-500">Không tìm thấy sản phẩm nào.</div>
        )}
      </div>
    </div>
  );
};

export default AdminProductsPage;