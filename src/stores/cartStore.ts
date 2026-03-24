import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  what_is_included: string[];
  price: number;
  duration_minutes: number;
  image_url: string;
}

export interface CartItem {
  service: Service;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (service: Service) => void;
  removeItem: (serviceId: string) => void;
  updateQuantity: (serviceId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (service) => set((state) => {
        const existingItem = state.items.find(item => item.service.id === service.id);
        if (existingItem) {
          return {
            items: state.items.map(item =>
              item.service.id === service.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          };
        }
        return { items: [...state.items, { service, quantity: 1 }] };
      }),
      removeItem: (serviceId) => set((state) => ({
        items: state.items.filter(item => item.service.id !== serviceId)
      })),
      updateQuantity: (serviceId, quantity) => set((state) => ({
        items: state.items.map(item =>
          item.service.id === serviceId
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        )
      })),
      clearCart: () => set({ items: [] }),
      getTotalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      getSubtotal: () => get().items.reduce((total, item) => total + (item.service.price * item.quantity), 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);
