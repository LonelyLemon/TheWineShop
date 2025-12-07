import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [shouldRefreshCart, setShouldRefreshCart] = useState(false); 

  const fetchCartCount = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
        setCartCount(0);
        return;
    }

    try {
      const response = await axiosClient.get('/api/cart');
      const totalItems = response.data.items.reduce((acc, item) => acc + item.quantity, 0);
      setCartCount(totalItems);
    } catch (error) {
      console.error("Failed to fetch cart count", error);
      setCartCount(0);
    }
  };

  useEffect(() => {
    fetchCartCount();
  }, [shouldRefreshCart]);

  const refreshCart = () => {
    setShouldRefreshCart(prev => !prev);
  };

  return (
    <CartContext.Provider value={{ cartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);