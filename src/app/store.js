// src/app/store.js
// ── Add these new fields to your EXISTING Zustand store ────────────────────────
// Only merge the lines marked ✅ NEW into your current store definition.
// Do NOT replace your existing addToCart / removeFromCart / updateQty etc.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set) => ({
      // ── Your existing cart fields (keep as-is) ──────────────────────────────
      items: [],

      addToCart: (item, qty = 1, onStockError) =>
        set((state) => {
          const isPreOrder = !!item.pre_order_status;
          const stock = Number(item.variant?.stock ?? item.stock ?? 999);
      
          if (!isPreOrder && stock <= 0) {
            onStockError?.('Item out of stock!');
            return state;
          }
      
          const existing = state.items.find((i) => {
            if (i.variant?.id === item.variant?.id) return true;
            return i.id === item.id && !item.variant;
          });
      
          if (existing) {
            if (!isPreOrder) {
              const newQty = Math.min(existing.quantity + qty, stock, 99);
              if (newQty === existing.quantity) {
                onStockError?.(`Max ${stock} available`);
                return state;
              }
              return {
                items: state.items.map((i) =>
                  i.id === item.id && i.variant?.id === item.variant?.id
                    ? { ...i, quantity: newQty }
                    : i
                ),
              };
            } else {
              // Pre-order: no stock cap, just increment
              return {
                items: state.items.map((i) =>
                  i.id === item.id && i.variant?.id === item.variant?.id
                    ? { ...i, quantity: existing.quantity + qty }
                    : i
                ),
              };
            }
          }
      
          return {
            items: [...state.items, {
              ...item,
              quantity: qty,
              stock: isPreOrder ? 9999 : stock,
            }],
          };
        }),

      removeFromCart: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      updateQty: (id, qty, onStockError) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;
          const isPreOrder = !!item.pre_order_status;
          if (!isPreOrder) {
            const stock = Number(item.variant?.stock ?? item.stock ?? 999);
            if (qty > stock) {
              onStockError?.(`Only ${stock} item(s) available in stock!`);
              return state;
            }
          }
          return {
            items: state.items.map((i) => (i.id === id ? { ...i, quantity: qty } : i)),
          };
        }),

      clearCart: () => set({ items: [], couponData: null }),

      // ── Your existing auth fields (keep as-is, example shown) ──────────────
      // token: null,
      // user: null,
      // setToken: (token) => set({ token }),
      // setUser: (user) => set({ user }),
      // logout: () => set({ token: null, user: null }),

      // ✅ NEW: Coupon data shared between CartPage → CheckoutPage ─────────────
      // Shape: { coupon: string, subtotal: number, discount: number, grandTotal: number } | null
      couponData: null,

      setCouponData: (data) => set({ couponData: data }),

      clearCouponData: () => set({ couponData: null }),
    }),
    {
      name: 'elonis-cart', // localStorage key — keep your existing name
    },
  ),
);

export default useCartStore;