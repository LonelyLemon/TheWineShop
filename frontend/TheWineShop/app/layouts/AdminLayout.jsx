import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Package, Users, ShoppingBag, BarChart } from 'lucide-react';

const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-wine-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold border-b border-wine-800">Admin</div>
        <nav className="flex-1 p-4 space-y-2">
           <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-wine-800">
             <BarChart size={20} /> Dashboard
           </Link>
           <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-wine-800">
             <Package size={20} /> Products
           </Link>
           <Link to="/admin/orders" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-wine-800">
             <ShoppingBag size={20} /> Orders
           </Link>
           <Link to="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded hover:bg-wine-800">
             <Users size={20} /> Users
           </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
         <div className="bg-white rounded-lg shadow p-6 min-h-full">
            <Outlet />
         </div>
      </main>
    </div>
  );
};

export default AdminLayout;