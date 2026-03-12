import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishmentStore } from "@/store/establishmentStore";
import type { EstablishmentData } from "@/services/establishments";

/**
 * Hydrate le store global avec l'établissement actif (is_active=true) depuis Supabase.
 * Appelé au mount des routes protégées : une seule source de vérité au chargement.
 */

// TODO :- find alternative for isActive
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
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("current_establishment_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("Profile fetch error:", profileError);
        return;
      }

      const establishmentId = profile?.current_establishment_id;

      if (!establishmentId) {
        console.warn("No current establishment set");
        return;
      }

      const { data, error } = await supabase
        .from("establishments")
        .select(
          "place_id, name, formatted_address, lat, lng, website, phone, rating",
        )
        .eq("id", establishmentId)
        .maybeSingle();

      if (error || !data) {
        const { data: list } = await supabase
          .from("establishments")
          .select(
            "place_id, name, formatted_address, lat, lng, website, phone, rating",
          )
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1);
        const row = list?.[0];
        if (row) {
          const estab: EstablishmentData = {
            place_id: row.place_id,
            name: row.name ?? "",
            formatted_address: row.formatted_address ?? "",
            lat: row.lat ?? undefined,
            lng: row.lng ?? undefined,
            website: row.website ?? undefined,
            phone: row.phone ?? undefined,
            rating: row.rating ?? undefined,
          };
          useEstablishmentStore.getState().setSelectedEstablishment(estab);
        }
        return;
      }

      const estab: EstablishmentData = {
        place_id: data.place_id,
        name: data.name ?? "",
        formatted_address: data.formatted_address ?? "",
        lat: data.lat ?? undefined,
        lng: data.lng ?? undefined,
        website: data.website ?? undefined,
        phone: data.phone ?? undefined,
        rating: data.rating ?? undefined,
      };
      useEstablishmentStore.getState().setSelectedEstablishment(estab);
    })();
  }, [userId]);
}
