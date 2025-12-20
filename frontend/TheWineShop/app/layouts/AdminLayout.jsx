import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    toast.info("Đã đăng xuất");
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Tổng quan' },
    { path: '/admin/products', icon: '🍷', label: 'Sản phẩm' },
    { path: '/admin/orders', icon: '📦', label: 'Đơn hàng' },
    { path: '/admin/users', icon: '👥', label: 'Khách hàng' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow-md flex flex-col fixed h-full z-10">
        <div className="h-16 flex items-center justify-center border-b">
          <Link to="/" className="text-2xl font-bold text-[#800020]">
            TheWineShop <span className="text-xs text-gray-500 block text-center">Admin Panel</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-red-50 hover:text-[#800020] transition-colors ${
                    location.pathname === item.path ? 'bg-red-50 text-[#800020] border-r-4 border-[#800020]' : ''
                  }`}
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  );
};

export default AdminLayout;