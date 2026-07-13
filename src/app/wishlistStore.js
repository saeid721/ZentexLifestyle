// src/app/wishlistStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],

      // ✅ Add a product to the wishlist (no duplicates)
      addItem: (product) => {
        const exists = get().items.some((item) => item.id === product.id);
        if (exists) return;
        set((state) => ({ items: [...state.items, product] }));
      },

      // ✅ Remove a product from the wishlist by id
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      // ✅ Toggle: add if not present, remove if present
      toggleItem: (product) => {
        const exists = get().items.some((item) => item.id === product.id);
        if (exists) {
          set((state) => ({
            items: state.items.filter((item) => item.id !== product.id),
          }));
        } else {
          set((state) => ({ items: [...state.items, product] }));
        }
      },

      // ✅ Check if a product is already in the wishlist
      isInWishlist: (productId) => {
        return get().items.some((item) => item.id === productId);
      },

      // ✅ Clear the entire wishlist
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wishlist-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useWishlistStore;