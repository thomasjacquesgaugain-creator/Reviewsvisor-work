import { create } from "zustand";
import { EstablishmentData } from "@/services/establishments";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EstablishmentStore {
  selectedEstablishment: EstablishmentData | null;
  setSelectedEstablishment: (establishment: EstablishmentData | null) => void;
  clearSelectedEstablishment: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  /** place_id de l'établissement actif (source unique pour badge / sync). */
  activePlaceId: string | null;
  activeEstablishmentId: string | null;
  
  /**
   * Définit l'établissement actif : update optimiste store, persist Supabase (établissements.is_active), rollback + toast si erreur.
   * Toute l'app lit activePlaceId / selectedEstablishment depuis ce store.
   */
  setActivePlace: (
    placeId: string,
    establishment?: EstablishmentData | null,
  ) => Promise<void>;
}

export const useEstablishmentStore = create<EstablishmentStore>((set, get) => ({
  selectedEstablishment: null,
  activePlaceId: null,
  activeEstablishmentId: null,
  setSelectedEstablishment: (establishment) =>
    set({
      selectedEstablishment: establishment,
      activePlaceId: establishment?.place_id ?? null,
      activeEstablishmentId: establishment?.id ?? null,
    }),
  clearSelectedEstablishment: () =>
    set({
      selectedEstablishment: null,
      activePlaceId: null,
      activeEstablishmentId: null,
    }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  setActivePlace: async (
    placeId: string,
    establishment?: EstablishmentData | null,
  ) => {
    const prev = get().selectedEstablishment;
    const payload: EstablishmentData = establishment ?? {
      place_id: placeId,
      name: "",
      formatted_address: "",
    };
    set({
      selectedEstablishment: payload,
      activePlaceId: placeId,
      activeEstablishmentId: payload.id ?? null,
    });
    if (import.meta.env.DEV) {
      console.log("[establishmentStore] activePlaceId changed", {
        placeId,
        name: payload.name,
      });
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) return;
    try {
      // Read back the full DB row so callers can pass a partial payload and the
      // store still gets fields like `types` without waiting for a page refresh.
      const { data: estab, error: estabError } = await supabase
        .from("establishments")
        .select(
          "id, user_id, place_id, name, formatted_address, lat, lng, phone, website, rating, user_ratings_total, types, source, raw, created_at, updated_at",
        )
        .eq("place_id", placeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (estabError || !estab) throw estabError;

      set({
        selectedEstablishment: {
          id: estab.id,
          user_id: estab.user_id ?? undefined,
          place_id: estab.place_id,
          name: estab.name ?? payload.name,
          formatted_address:
            estab.formatted_address ?? payload.formatted_address,
          lat: estab.lat ?? payload.lat,
          lng: estab.lng ?? payload.lng,
          phone: estab.phone ?? payload.phone,
          website: estab.website ?? payload.website,
          rating: estab.rating ?? payload.rating,
          user_ratings_total:
            estab.user_ratings_total ?? payload.user_ratings_total,
          types: estab.types ?? payload.types ?? null,
          source: estab.source ?? payload.source,
          raw: estab.raw ?? payload.raw,
          created_at: estab.created_at ?? payload.created_at,
          updated_at: estab.updated_at ?? payload.updated_at,
        },
        activePlaceId: placeId,
        activeEstablishmentId: estab.id,
      });

      // update profile current establishment
      const { error } = await supabase
        .from("profiles")
        .update({
          current_establishment_id: estab.id,
        })
        .eq("user_id", user.id);

      if (error) throw error;

      if (error) throw error;
    } catch (err) {
      set({
        selectedEstablishment: prev,
        activePlaceId: prev?.place_id ?? null,
        activeEstablishmentId: prev?.id ?? null,
      });
      toast.error("Impossible de définir l'établissement actif");
      if (import.meta.env.DEV)
        console.error("[establishmentStore] setActivePlace error", err);
    }
  },
}));
