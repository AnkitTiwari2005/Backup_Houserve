import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  role: 'customer' | 'technician' | 'admin';
  full_name: string;
  phone: string | null;
  email: string;
  avatar_url: string | null;
  stripe_customer_id: string | null;
}

interface AuthState {
  user: any | null;
  profile: UserProfile | null;
  isLoading: boolean;
  setUser: (user: any | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      setUser: (user) => set({ user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, profile: null });
        // SECURE: Clear sensitive stores on logout (Audit Fix #4.1)
        const { useAddressStore } = await import('./addressStore');
        const { useCartStore } = await import('./cartStore');
        useAddressStore.getState().clearAddress();
        useCartStore.getState().clearCart();
      },
      fetchProfile: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (!error && data) {
            set({ profile: data });
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          set({ isLoading: false });
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
);
