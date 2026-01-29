import { create } from 'zustand';
import { EstablishmentData } from '@/services/establishments';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EstablishmentStore {
  selectedEstablishment: EstablishmentData | null;
  setSelectedEstablishment: (establishment: EstablishmentData | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  /** place_id de l'établissement actif (source unique pour badge / sync). */
  activePlaceId: string | null;
  /**
   * Définit l'établissement actif : update optimiste store, persist Supabase (établissements.is_active), rollback + toast si erreur.
   * Toute l'app lit activePlaceId / selectedEstablishment depuis ce store.
   */
  setActivePlace: (placeId: string, establishment?: EstablishmentData | null) => Promise<void>;
}

export const useEstablishmentStore = create<EstablishmentStore>((set, get) => ({
  selectedEstablishment: null,
  activePlaceId: null,
  setSelectedEstablishment: (establishment) => set({
    selectedEstablishment: establishment,
    activePlaceId: establishment?.place_id ?? null,
  }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  setActivePlace: async (placeId: string, establishment?: EstablishmentData | null) => {
    const prev = get().selectedEstablishment;
    const payload: EstablishmentData = establishment ?? {
      place_id: placeId,
      name: '',
      formatted_address: '',
    };
    set({ selectedEstablishment: payload, activePlaceId: placeId });
    if (import.meta.env.DEV) {
      console.log('[establishmentStore] activePlaceId changed', { placeId, name: payload.name });
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) return;
    try {
      await supabase
        .from('établissements')
        .update({ is_active: false })
        .eq('user_id', user.id);
      const { error } = await supabase
        .from('établissements')
        .update({ is_active: true })
        .eq('user_id', user.id)
        .eq('place_id', placeId);
      if (error) throw error;
    } catch (err) {
      set({ selectedEstablishment: prev, activePlaceId: prev?.place_id ?? null });
      toast.error('Impossible de définir l\'établissement actif');
      if (import.meta.env.DEV) console.error('[establishmentStore] setActivePlace error', err);
    }
  },
}));