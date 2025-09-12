import { create } from 'zustand';
import { EstablishmentData } from '@/services/establishments';

interface EstablishmentStore {
  selectedEstablishment: EstablishmentData | null;
  setSelectedEstablishment: (establishment: EstablishmentData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useEstablishmentStore = create<EstablishmentStore>((set) => ({
  selectedEstablishment: null,
  setSelectedEstablishment: (establishment) => set({ selectedEstablishment: establishment }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));