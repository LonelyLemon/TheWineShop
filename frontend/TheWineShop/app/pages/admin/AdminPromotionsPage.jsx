import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { 
  Tag, Plus, Calendar, Trash2, Edit, X, Save, Percent, DollarSign 
} from 'lucide-react';

const AdminPromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // State cho Form
  const [formData, setFormData] = useState({
    id: null,
    code: '',
    discount_value: '',
    discount_type: 'percent', // 'percent' hoặc 'fixed'
    start_date: '',
    end_date: '',
    usage_limit: 100,
    is_active: true
  });

    // 1. Lấy danh sách khuyến mãi
  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      // const res = await axiosClient.get('/api/promotions');
      // setPromotions(res.data);
      
        // Giả lập dữ liệu
      setTimeout(() => {
        setPromotions([
            { id: 1, code: 'WELCOME10', discount_value: 10, discount_type: 'percent', start_date: '2024-01-01', end_date: '2024-12-31', usage_limit: 500, used: 120, is_active: true },
            { id: 2, code: 'TET2024', discount_value: 50000, discount_type: 'fixed', start_date: '2024-01-20', end_date: '2024-02-20', usage_limit: 100, used: 90, is_active: false },
            { id: 3, code: 'WINE50', discount_value: 50, discount_type: 'percent', start_date: '2024-03-01', end_date: '2024-03-05', usage_limit: 50, used: 12, is_active: true },
        ]);
        setLoading(false);
      }, 500);
      // ----------------------------------------------------
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  // 2. Xử lý Form
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
    }));
  };

  const openModal = (promo = null) => {
    if (promo) {
        setIsEditMode(true);
        setFormData(promo);
    } else {
        setIsEditMode(false);
        setFormData({
            id: null, code: '', discount_value: '', discount_type: 'percent',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '', usage_limit: 100, is_active: true
        });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Validate cơ bản
    if (!formData.code || !formData.discount_value || !formData.end_date) {
        toast.warning("Vui lòng điền đầy đủ thông tin bắt buộc");
        return;
    }

    try {
        if (isEditMode) {
            // await axiosClient.put(`/api/promotions/${formData.id}`, formData);
            toast.success("Cập nhật khuyến mãi thành công");
            // Cập nhật UI giả
            setPromotions(prev => prev.map(p => p.id === formData.id ? formData : p));
        } else {
            // await axiosClient.post('/api/promotions', formData);
            toast.success("Tạo mã khuyến mãi thành công");
            // Cập nhật UI giả
            setPromotions(prev => [...prev, { ...formData, id: Date.now(), used: 0 }]);
        }
        setShowModal(false);
    } catch (error) {
        toast.error("Lỗi khi lưu dữ liệu");
    }
  };

  const handleDelete = async (id) => {
      if(window.confirm("Bạn có chắc muốn xóa mã này?")) {
          // await axiosClient.delete(`/api/promotions/${id}`);
          setPromotions(prev => prev.filter(p => p.id !== id));
          toast.info("Đã xóa mã khuyến mãi");
      }
  }

    // Định dạng hiển thị giá trị giảm giá
  const formatDiscount = (value, type) => {
      return type === 'percent' ? `-${value}%` : `-${value.toLocaleString()}₫`;
  };

  return (
    <div className="animate-fade-in-up">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag className="text-[#800020]" /> Quản lý Khuyến mãi
          </h1>
          <p className="text-sm text-gray-500 mt-1">Tạo mã giảm giá và chương trình ưu đãi</p>
        </div>
        <button 
            onClick={() => openModal()}
            className="bg-[#800020] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#600018] transition shadow-sm"
        >
          <Plus size={18} /> Tạo mã mới
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Mã Code</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Giá trị giảm</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Thời gian</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-center">Lượt dùng</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
                <tr><td colSpan="6" className="text-center py-8">Đang tải...</td></tr>
            ) : promotions.map((promo) => (
              <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                    <span className="font-mono font-bold text-[#800020] bg-red-50 px-3 py-1 rounded border border-red-100 dashed border-2">
                        {promo.code}
                    </span>
                </td>
                <td className="px-6 py-4 font-bold text-gray-800">
                    {formatDiscount(promo.discount_value, promo.discount_type)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400">Bắt đầu: {promo.start_date}</span>
                        <span className="font-medium text-gray-700">Kết thúc: {promo.end_date}</span>
                    </div>
                </td>
                <td className="px-6 py-4 text-center text-sm">
                    <span className="font-semibold text-gray-700">{promo.used}</span>
                    <span className="text-gray-400"> / {promo.usage_limit}</span>
                </td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        promo.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                        {promo.is_active ? 'Đang chạy' : 'Tạm dừng'}
                    </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => openModal(promo)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDelete(promo.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && promotions.length === 0 && (
            <div className="p-8 text-center text-gray-500">Chưa có chương trình khuyến mãi nào.</div>
        )}
      </div>

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-in">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">
                        {isEditMode ? 'Cập nhật mã giảm giá' : 'Tạo mã khuyến mãi mới'}
                    </h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                <form onSubmit={handleSave} className="p-6 space-y-4">
                    {/* Code Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mã Code (Viết liền, in hoa)</label>
                        <input 
                            type="text" name="code"
                            value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 outline-none uppercase font-mono font-bold"
                            placeholder="VD: SUMMER2024"
                        />
                    </div>

                    {/* Discount Value & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá trị giảm</label>
                            <input 
                                type="number" name="discount_value"
                                value={formData.discount_value} onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800020]/20 outline-none"
                                placeholder="10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Loại giảm giá</label>
                            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, discount_type: 'percent'})}
                                    className={`flex-1 py-2 flex justify-center items-center gap-1 text-sm font-medium transition
                                        ${formData.discount_type === 'percent' ? 'bg-[#800020] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <Percent size={14}/> Phần trăm
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({...formData, discount_type: 'fixed'})}
                                    className={`flex-1 py-2 flex justify-center items-center gap-1 text-sm font-medium transition
                                        ${formData.discount_type === 'fixed' ? 'bg-[#800020] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                                >
                                    <DollarSign size={14}/> Số tiền
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                            <input 
                                type="date" name="start_date"
                                value={formData.start_date} onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                            <input 
                                type="date" name="end_date"
                                value={formData.end_date} onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                            />
                        </div>
                    </div>

                    {/* Limit & Active */}
                    <div className="flex items-center gap-4">
                         <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Giới hạn lượt dùng</label>
                            <input 
                                type="number" name="usage_limit"
                                value={formData.usage_limit} onChange={handleInputChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none"
                            />
                         </div>
                         <div className="flex items-center h-full pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" name="is_active"
                                    checked={formData.is_active} onChange={handleInputChange}
                                    className="w-5 h-5 accent-[#800020] rounded"
                                />
                                <span className="text-sm font-medium text-gray-700">Kích hoạt ngay</span>
                            </label>
                         </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
                        <button 
                            type="button" onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                        >
                            Hủy
                        </button>
                        <button 
                            type="submit"
                            className="px-4 py-2 text-white bg-[#800020] hover:bg-[#600018] rounded-lg font-bold shadow-md transition flex items-center gap-2"
                        >
                            <Save size={18} /> Lưu mã
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPromotionsPage;
