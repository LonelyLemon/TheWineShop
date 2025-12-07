// eslint-disable-next-line no-unused-vars
import { useState } from 'react'
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import MainLayout from './layouts/MainLayout';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrdersPage from './pages/OrdersPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import ProfilePage from './pages/ProfilePage';
import './App.css';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route element={<MainLayout />}>
           <Route path="/" element={<HomePage />} />
           <Route path="/products/:id" element={<ProductDetailPage />} />
           <Route path="/cart" element={<CartPage />} />
           <Route path="/checkout" element={<CheckoutPage />} />
           <Route path="/orders" element={<OrdersPage />} />
           <Route path="/profile" element={<ProfilePage />} />
           <Route path="/admin/orders" element={<AdminOrdersPage />} />
        </Route>
      </Routes>
    </>
  )
}
export default App