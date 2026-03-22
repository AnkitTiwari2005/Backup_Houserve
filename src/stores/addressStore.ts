import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  flat_number: string;
  building_name?: string;
  street: string;
  landmark?: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  full_address: string;
  phone?: string;
}

interface AddressState {
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set) => ({
      selectedAddress: null,
      setSelectedAddress: (address) => set({ selectedAddress: address }),
    }),
    {
      name: 'address-storage',
    }
  )
);
