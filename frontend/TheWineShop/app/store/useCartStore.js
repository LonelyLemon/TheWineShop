// app/store/useCartStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      
      // Hành động: Thêm vào giỏ
      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existingItem = items.find((i) => i.id === product.id);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
            ),
          });
        } else {
          set({ items: [...items, { ...product, quantity }] });
        }
      },

      // Hành động: Xóa khỏi giỏ
      removeItem: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },

      // Tính toán: Tổng số lượng chai (để check điều kiện Mix-6)
      getTotalBottles: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // Tính toán: Tổng tiền (Tự động áp dụng giá Mix-6 nếu >= 6 chai)
      getTotalPrice: () => {
        const items = get().items;
        const totalBottles = items.reduce((total, item) => total + item.quantity, 0);
        const isMix6 = totalBottles >= 6;

        return items.reduce((total, item) => {
          // Backend cần trả về price_single và price_mix_6
          const price = isMix6 ? (item.price_mix_6 || item.price * 0.85) : item.price; 
          return total + price * item.quantity;
        }, 0);
      },
      
      clearCart: () => set({ items: [] }),
    }),
    {
      name: 'wine-cart-storage', // Lưu vào LocalStorage
    }
  )
);