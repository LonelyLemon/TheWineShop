import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { 
  DollarSign, 
  ShoppingBag, 
  Users, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowRight,
  Package
} from 'lucide-react';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosClient.get('/api/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Lỗi tải thống kê", error);
        // Dữ liệu giả lập (Fallback) để bạn thấy giao diện nếu API chưa có
        setStats({
            revenue: 150250000,
            total_orders: 124,
            pending_orders: 12,
            total_customers: 340,
            low_stock_count: 5,
            low_stock_details: [
                { id: 1, name: "Chateau Dalat Special", stock: 2 },
                { id: 2, name: "Vang Chile Red", stock: 0 },
                { id: 3, name: "Vang Đà Lạt Export", stock: 8 },
            ]
        });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800020]"></div>
      </div>
    );
  }

  // Component Card nhỏ để tái sử dụng
  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${color} text-white shadow-sm`}>
                {icon}
            </div>
        </div>
        <div className="flex items-center text-sm">
            <span className="text-green-500 flex items-center font-medium bg-green-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight size={14} className="mr-1" />
                {trend}
            </span>
            <span className="text-gray-400 ml-2">so với tháng trước</span>
        </div>
    </div>
  );

  return (
    <div className="animate-fade-in-up">
      {/* 1. HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Tổng quan hệ thống</h1>
        <p className="text-gray-500 mt-1">Chào mừng trở lại, đây là tình hình kinh doanh hôm nay.</p>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
            title="Tổng doanh thu" 
            value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue)}
            icon={<DollarSign size={22} />}
            color="bg-emerald-500"
            trend="+12.5%"
        />
        <StatCard 
            title="Đơn hàng mới" 
            value={stats.total_orders}
            icon={<ShoppingBag size={22} />}
            color="bg-blue-500"
            trend="+5.2%"
        />
        <StatCard 
            title="Khách hàng" 
            value={stats.total_customers}
            icon={<Users size={22} />}
            color="bg-purple-500"
            trend="+2.4%"
        />
        <StatCard 
            title="Cần xử lý" 
            value={stats.pending_orders}
            icon={<AlertTriangle size={22} />}
            color="bg-orange-500"
            trend="Ưu tiên"
        />
      </div>

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: RECENT ORDERS (Chiếm 2 phần) */}
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800 text-lg">Đơn hàng cần xử lý</h2>
                    <Link to="/admin/orders" className="text-sm text-[#800020] hover:underline flex items-center gap-1 font-medium">
                        Xem tất cả <ArrowRight size={16} />
                    </Link>
                </div>
                
                {stats.pending_orders > 0 ? (
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Mã đơn</th>
                                <th className="px-6 py-3 font-semibold">Trạng thái</th>
                                <th className="px-6 py-3 font-semibold text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                             {/* Giả lập data nếu API stats chưa trả về list order chi tiết */}
                            {[1, 2, 3].map((_, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-700">#ORD-2023-{100 + i}</td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Chờ xác nhận
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link to="/admin/orders" className="text-sm font-semibold text-blue-600 hover:text-blue-800">Xử lý</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                   </div>
                ) : (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <Package size={40} className="text-gray-300 mb-3" />
                        <p>Tuyệt vời! Không có đơn hàng nào tồn đọng.</p>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: LOW STOCK & QUICK ACTIONS (Chiếm 1 phần) */}
        <div className="space-y-8">
            
            {/* Low Stock Alert */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-red-50 flex items-center gap-2">
                    <AlertTriangle className="text-red-600" size={20} />
                    <h2 className="font-bold text-red-800">Cảnh báo kho</h2>
                </div>
                
                <div className="p-0">
                    {stats.low_stock_details && stats.low_stock_details.length > 0 ? (
                        <ul className="divide-y divide-gray-100">
                            {stats.low_stock_details.map((item) => (
                                <li key={item.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                                        <p className="text-xs text-gray-500">Mã: SP-{item.id}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.stock === 0 ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                                            {item.stock === 0 ? 'Hết hàng' : `Còn ${item.stock}`}
                                        </span>
                                        <Link to={`/admin/products/edit/${item.id}`} className="text-[10px] text-blue-600 hover:underline mt-1">
                                            Nhập kho
                                        </Link>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-6 text-center text-sm text-green-600 font-medium">
                            Kho hàng ổn định ✅
                        </div>
                    )}
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
                    <Link to="/admin/products" className="text-xs text-gray-600 font-semibold hover:text-[#800020]">
                        Xem toàn bộ kho hàng &rarr;
                    </Link>
                </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-gradient-to-br from-[#800020] to-[#500010] rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-bold text-lg mb-2">Thao tác nhanh</h3>
                <p className="text-red-100 text-sm mb-6">Tạo nhanh các tài nguyên mới cho hệ thống.</p>
                <div className="space-y-3">
                    <Link to="/admin/products/new" className="block w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-center text-sm font-semibold backdrop-blur-sm transition border border-white/10">
                        + Thêm sản phẩm mới
                    </Link>
                    <Link to="/admin/promotions" className="block w-full py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-center text-sm font-semibold backdrop-blur-sm transition border border-white/10">
                        + Tạo khuyến mãi
                    </Link>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;