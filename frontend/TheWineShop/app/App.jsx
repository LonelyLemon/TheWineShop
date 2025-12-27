// eslint-disable-next-line no-unused-vars
import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- AUTH & PUBLIC PAGES ---
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

// --- CUSTOMER PAGES ---
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import ProfilePage from './pages/ProfilePage';

// --- ADMIN PAGES & LAYOUT ---
import AdminLayout from './layouts/AdminLayout'; 
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminPromotionsPage from './pages/admin/AdminPromotionsPage';
import AdminProductForm from './pages/admin/AdminProductForm';

import './App.css';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      <Routes>
        {/* 1. ROUTES (Login/Register) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* 2. ROUTES KHÁCH HÀNG (Dùng MainLayout - Có Header/Footer khách) */}
        <Route element={<MainLayout />}>
           <Route path="/" element={<HomePage />} />
           <Route path="/products" element={<ProductsPage />} />
           <Route path="/products/:id" element={<ProductDetailPage />} />
           <Route path="/cart" element={<CartPage />} />
           <Route path="/checkout" element={<CheckoutPage />} />
           <Route path="/orders" element={<OrdersPage />} />
           <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* 3. ROUTES ADMIN (Dùng AdminLayout - Có Sidebar quản trị) */}
        <Route path="/admin" element={<AdminLayout />}>
           {/* Vào /admin tự động nhảy sang dashboard */}
           <Route index element={<Navigate to="dashboard" replace />} />
           
           <Route path="dashboard" element={<AdminDashboardPage />} />
           <Route path="orders" element={<AdminOrdersPage />} />
           <Route path="users" element={<AdminUsersPage />} />
           
           {/* Quản lý sản phẩm */}
           <Route path="products" element={<AdminProductsPage />} />
           <Route path="products/new" element={<AdminProductForm />} />       
           <Route path="products/edit/:id" element={<AdminProductForm />} /> 
           
           <Route path="inventory" element={<AdminInventoryPage />} />
           <Route path="promotions" element={<AdminPromotionsPage />} />
        </Route>

      </Routes>
    </>
  )
}

export default App