import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { UploadCloud, X, Save, ArrowLeft, ImagePlus } from 'lucide-react';

// --- 1. ĐỊNH NGHĨA DANH MỤC PHÂN CẤP ---
const CATEGORY_OPTIONS = [
  {
    group: "Rượu vang (Wine)",
    items: [
      { value: "Red Wine", label: "Vang đỏ (Red wine)" },
      { value: "White Wine", label: "Vang trắng (White wine)" },
      { value: "Rose Wine", label: "Vang hồng (Rosé)" },
      { value: "Sparkling Wine", label: "Vang sủi (Champagne/Sparkling)" }
    ]
  },
  {
    group: "Rượu nền (Spirits / Liquor)",
    items: [
      { value: "Vodka", label: "Vodka" },
      { value: "Whisky", label: "Whisky" },
      { value: "Rum", label: "Rum" },
      { value: "Gin", label: "Gin" },
      { value: "Tequila", label: "Tequila" },
      { value: "Brandy", label: "Brandy" }
    ]
  },
  {
    group: "Rượu truyền thống",
    items: [
      { value: "Rice Wine", label: "Rượu trắng (Việt Nam)" },
      { value: "Sake", label: "Sake (Nhật)" },
      { value: "Soju", label: "Soju (Hàn)" },
      { value: "Baijiu", label: "Baijiu (Trung Quốc)" }
    ]
  },
  {
    group: "Bia (Beer)",
    items: [
      { value: "Lager", label: "Lager" },
      { value: "Ale", label: "Ale" },
      { value: "IPA", label: "IPA" },
      { value: "Stout", label: "Stout" },
      { value: "Craft Beer", label: "Craft beer (Bia thủ công)" }
    ]
  }
];

const AdminProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // State mặc định
  const [product, setProduct] = useState({
    name: '',
    price: '',
    stock_quantity: '',
    category: '', // Để trống ban đầu để bắt buộc chọn
    description: '',
    year: '',
    origin: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        setInitialLoading(true);
        try {
          const res = await axiosClient.get(`/api/products/${id}`);
          const data = res.data;
          
          setProduct({
            name: data.name,
            price: data.price,
            stock_quantity: data.stock_quantity,
            category: data.category,
            description: data.description || '',
            year: data.year || '',
            origin: data.origin || ''
          });

          if (data.image_url) {
            setImagePreview(data.image_url);
          }
        } catch (error) {
          toast.error("Không tìm thấy sản phẩm");
          navigate('/admin/products');
        } finally {
          setInitialLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate Category
    if (!product.category) {
        toast.warning("Vui lòng chọn danh mục sản phẩm!");
        return;
    }

    setLoading(true);
    
    try {
      const formData = new FormData();
      Object.keys(product).forEach(key => {
        formData.append(key, product[key]);
      });

      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      if (isEditMode) {
        await axiosClient.put(`/api/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success("Cập nhật sản phẩm thành công!");
      } else {
        await axiosClient.post('/api/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success("Thêm sản phẩm thành công!");
      }

      navigate('/admin/products');
      
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.detail || "Lỗi khi lưu sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in-up">
      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20} className="text-gray-500"/>
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
            {isEditMode ? `Cập nhật: ${product.name}` : "Thêm sản phẩm mới"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Thông tin chung</h2>
                <div className="space-y-4">
                    <div>
                        <label className="label-text block mb-1 font-medium text-sm text-gray-700">Tên sản phẩm</label>
                        <input type="text" name="name" value={product.name} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] outline-none transition text-sm" placeholder="VD: Vang Đà Lạt..." required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label-text block mb-1 font-medium text-sm text-gray-700">Giá bán (VNĐ)</label>
                            <input type="number" name="price" value={product.price} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] outline-none transition text-sm" placeholder="0" required />
                        </div>
                        <div>
                            <label className="label-text block mb-1 font-medium text-sm text-gray-700">Số lượng kho</label>
                            <input type="number" name="stock_quantity" value={product.stock_quantity} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] outline-none transition text-sm" placeholder="0" required />
                        </div>
                    </div>
                    <div>
                        <label className="label-text block mb-1 font-medium text-sm text-gray-700">Mô tả</label>
                        <textarea name="description" rows="4" value={product.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] outline-none transition text-sm resize-none"></textarea>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Chi tiết</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    
                    {/* --- PHẦN SELECT DANH MỤC ĐÃ CẬP NHẬT --- */}
                    <div>
                        <label className="label-text block mb-1 font-medium text-sm text-gray-700">Danh mục</label>
                        <select 
                            name="category" 
                            value={product.category} 
                            onChange={handleChange} 
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] outline-none transition text-sm bg-white"
                        >
                            <option value="">-- Chọn loại rượu/bia --</option>
                            {CATEGORY_OPTIONS.map((group, index) => (
                                <optgroup key={index} label={group.group}>
                                    {group.items.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>
                    </div>
                    {/* ------------------------------------------- */}

                    <div>
                        <label className="label-text block mb-1 font-medium text-sm text-gray-700">Xuất xứ</label>
                        <input type="text" name="origin" value={product.origin} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] outline-none transition text-sm" placeholder="VD: Pháp" />
                    </div>
                    <div>
                        <label className="label-text block mb-1 font-medium text-sm text-gray-700">Niên vụ</label>
                        <input type="text" name="year" value={product.year} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] outline-none transition text-sm" placeholder="VD: 2018" />
                    </div>
                </div>
            </div>
        </div>

        {/* CỘT PHẢI */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Hình ảnh</h2>
                <div className="relative">
                    {!imagePreview ? (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-red-50 hover:border-[#800020] transition group">
                            <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-[#800020] mb-2" />
                            <span className="text-sm text-gray-500 font-semibold group-hover:text-[#800020]">Tải ảnh lên</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </label>
                    ) : (
                        <div className="relative w-full h-64 rounded-lg overflow-hidden border border-gray-200 group">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button type="button" onClick={removeImage} className="absolute top-2 right-2 p-1.5 bg-white text-red-600 rounded-full shadow hover:bg-red-50">
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
                {imageFile && <div className="mt-3 text-xs text-green-600 flex items-center gap-1"><ImagePlus size={14}/> Ảnh mới: {imageFile.name}</div>}
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-[#800020] text-white rounded-lg font-bold shadow hover:bg-[#600018] flex items-center justify-center gap-2 transition disabled:opacity-70">
                {loading ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <><Save size={20} /> {isEditMode ? "Cập nhật" : "Lưu sản phẩm"}</>}
            </button>
        </div>

      </form>
    </div>
  );
};

export default AdminProductForm;