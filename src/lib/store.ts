import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique item id in cart (in case of different addons)
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  addons: string[];
  size?: string;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  restaurantId: string | null;
  favorites: string[];
  userMunicipality: string | null;
  addItem: (item: CartItem, restaurantId: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  toggleFavorite: (id: string) => void;
  setUserMunicipality: (municipality: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,
      favorites: [],
      userMunicipality: null,
      
      addItem: (item, restId) => set((state) => {
        if (state.restaurantId && state.restaurantId !== restId) {
          return { items: [item], restaurantId: restId };
        }
        
        const existingIndex = state.items.findIndex(i => i.id === item.id);
        if (existingIndex >= 0) {
          const newItems = [...state.items];
          newItems[existingIndex].quantity += item.quantity;
          return { items: newItems, restaurantId: restId };
        }
        
        return { items: [...state.items, item], restaurantId: restId };
      }),
      
      removeItem: (id) => set((state) => ({
        items: state.items.filter(item => item.id !== id)
      })),
      
      updateQuantity: (id, qty) => set((state) => ({
        items: state.items.map(item => item.id === id ? { ...item, quantity: qty } : item)
      })),
      
      clearCart: () => set({ items: [], restaurantId: null }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },
      
      toggleFavorite: (id) => set((state) => ({
        favorites: state.favorites.includes(id)
          ? state.favorites.filter(fid => fid !== id)
          : [...state.favorites, id]
      })),
      
      setUserMunicipality: (m) => set({ userMunicipality: m })
    }),
    {
      name: 'mat3am-dz-storage',
    }
  )
);
