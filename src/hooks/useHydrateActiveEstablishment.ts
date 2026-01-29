import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishmentStore } from "@/store/establishmentStore";
import type { EstablishmentData } from "@/services/establishments";

/**
 * Hydrate le store global avec l'établissement actif (is_active=true) depuis Supabase.
 * Appelé au mount des routes protégées : une seule source de vérité au chargement.
 */
export function useHydrateActiveEstablishment(userId: string | undefined) {
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      hydratedRef.current = false;
      return;
    }
    const store = useEstablishmentStore.getState();
    if (store.selectedEstablishment !== null && store.activePlaceId !== null) {
      return;
    }
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    (async () => {
      const { data, error } = await supabase
        .from("établissements")
        .select("place_id, nom, adresse, lat, lng, website, telephone, rating")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        const { data: list } = await supabase
          .from("établissements")
          .select("place_id, nom, adresse, lat, lng, website, telephone, rating")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1);
        const row = list?.[0];
        if (row) {
          const estab: EstablishmentData = {
            place_id: row.place_id,
            name: row.nom ?? "",
            formatted_address: row.adresse ?? "",
            lat: row.lat ?? undefined,
            lng: row.lng ?? undefined,
            website: row.website ?? undefined,
            phone: row.telephone ?? undefined,
            rating: row.rating ?? undefined,
          };
          useEstablishmentStore.getState().setSelectedEstablishment(estab);
        }
        return;
      }

      const estab: EstablishmentData = {
        place_id: data.place_id,
        name: data.nom ?? "",
        formatted_address: data.adresse ?? "",
        lat: data.lat ?? undefined,
        lng: data.lng ?? undefined,
        website: data.website ?? undefined,
        phone: data.telephone ?? undefined,
        rating: data.rating ?? undefined,
      };
      useEstablishmentStore.getState().setSelectedEstablishment(estab);
    })();
  }, [userId]);
}
