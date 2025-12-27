import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { toast } from 'react-toastify';
import { 
  Search, 
  RefreshCw, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Lock, 
  Unlock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load danh sách user
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/api/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý tìm kiếm (Client-side search)
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const fullName = `${user.last_name || ''} ${user.first_name || ''}`.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const phone = (user.phone_number || '').toLowerCase();
    return fullName.includes(term) || email.includes(term) || phone.includes(term);
  });

  // Xử lý đổi Role
  const handleRoleChange = async (userId, newRole) => {
    // Không cần confirm mỗi lần đổi, chỉ cần toast thông báo kết quả (UX mượt hơn)
    // Hoặc giữ confirm nếu muốn an toàn tuyệt đối
    if (!window.confirm(`Đổi quyền thành viên này thành ${newRole}?`)) return;

    try {
      await axiosClient.patch(`/api/admin/users/${userId}/role`, { role: newRole });
      toast.success("Cập nhật quyền thành công");
      // Cập nhật state trực tiếp để đỡ phải gọi lại API (Optimistic UI)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi cập nhật");
    }
  };

  // Xử lý Ban/Unban
  const handleBanStatus = async (userId, currentStatus) => {
    const isBanned = currentStatus === 'banned';
    const actionText = isBanned ? 'Mở khóa' : 'Khóa (Ban)';
    
    if (!window.confirm(`Bạn có chắc muốn ${actionText} tài khoản này?`)) return;

    try {
      // Logic: Nếu đang banned -> is_active = true (để mở). Ngược lại is_active = false (để khóa)
      // Lưu ý: Backend của bạn nhận vào `is_active` boolean
      await axiosClient.post(`/api/admin/users/${userId}/ban`, { 
          is_active: isBanned // true = active (unban), false = inactive (ban)
      });
      
      toast.success(`Đã ${actionText} thành công`);
      // Cập nhật state local
      const newStatus = isBanned ? 'active' : 'banned';
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Lỗi xử lý");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '---';
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit'
    });
  };

  // Helper để lấy màu badge cho Role
  const getRoleStyle = (role) => {
      switch(role) {
          case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'stock_manager': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-gray-100 text-gray-700 border-gray-200';
      }
  };

  if (loading && users.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#800020]"></div>
        </div>
      );
  }

  return (
    <div className="animate-fade-in-up">
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield className="text-[#800020]" /> Quản lý Người dùng
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Tổng số: <span className="font-bold text-gray-800">{users.length}</span> tài khoản
          </p>
        </div>

        <div className="flex gap-3">
            {/* Search Box */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Tìm tên, email, sđt..." 
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800020]/20 focus:border-[#800020] w-64 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            {/* Refresh Button */}
            <button 
                onClick={fetchUsers} 
                className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-[#800020] transition-colors shadow-sm"
                title="Làm mới dữ liệu"
            >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </div>
      </div>

      {/* TABLE DATA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Thông tin người dùng</th>
                <th className="px-6 py-4 font-semibold">Liên hệ</th>
                <th className="px-6 py-4 font-semibold">Vai trò (Role)</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                 const isBanned = user.status === 'banned';
                 return (
                  <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${isBanned ? 'bg-gray-50 opacity-75' : ''}`}>
                    
                    {/* 1. User Info */}
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            {/* Avatar giả lập từ tên */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-sm
                                ${isBanned ? 'bg-gray-400' : 'bg-gradient-to-br from-[#800020] to-red-700'}`}>
                                {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                                <div className="font-semibold text-gray-900 flex items-center gap-1">
                                    {user.last_name} {user.first_name}
                                    {user.email_verified && <CheckCircle size={14} className="text-blue-500" title="Email đã xác thực" />}
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Mail size={12} /> {user.email}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                    Ngày tạo: {formatDate(user.created_at)}
                                </div>
                            </div>
                        </div>
                    </td>

                    {/* 2. Liên hệ */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex flex-col gap-1">
                            <span className="flex items-center gap-2">
                                <Phone size={14} className="text-gray-400"/> 
                                {user.phone_number || <span className="text-gray-300 italic">Chưa cập nhật</span>}
                            </span>
                            <span className="flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400"/> 
                                {user.city || <span className="text-gray-300 italic">---</span>}
                            </span>
                        </div>
                    </td>

                    {/* 3. Role Select */}
                    <td className="px-6 py-4">
                        <select 
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={isBanned} // Nếu bị ban thì không cho đổi role
                            className={`block w-full text-xs font-semibold py-1.5 px-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer
                                ${getRoleStyle(user.role)}
                                ${isBanned ? 'cursor-not-allowed opacity-50' : ''}
                            `}
                        >
                            <option value="customer">Customer</option>
                            <option value="stock_manager">Stock Manager</option>
                            <option value="admin">Admin</option>
                        </select>
                    </td>

                    {/* 4. Status Badge */}
                    <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border
                            ${isBanned 
                                ? 'bg-red-50 text-red-700 border-red-100' 
                                : 'bg-green-50 text-green-700 border-green-100'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isBanned ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            {isBanned ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                    </td>

                    {/* 5. Actions */}
                    <td className="px-6 py-4 text-right">
                         <button 
                            onClick={() => handleBanStatus(user.id, user.status)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm border
                                ${isBanned
                                    ? 'bg-white text-green-600 border-green-200 hover:bg-green-50'
                                    : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                                }
                            `}
                        >
                            {isBanned ? <Unlock size={14} /> : <Lock size={14} />}
                            {isBanned ? 'Mở khóa' : 'Khóa'}
                        </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
              <div className="p-12 text-center flex flex-col items-center text-gray-500">
                  <div className="bg-gray-100 p-4 rounded-full mb-3">
                      <Search size={32} className="text-gray-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-700">Không tìm thấy kết quả</p>
                  <p className="text-sm">Thử tìm kiếm với từ khóa khác.</p>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;