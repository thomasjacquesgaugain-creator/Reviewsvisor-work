import { useLayoutEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { useSmartStore } from "@/store/smartStore";
import type { EstablishmentData } from "@/services/establishments";

/**
 * Hydrate le store global avec l'établissement actif (is_active=true) depuis Supabase.
 * Appelé au mount des routes protégées : une seule source de vérité au chargement.
 */

// TODO :- find alternative for isActive
export function useHydrateActiveEstablishment(userId: string | undefined) {
  const hydratedRef = useRef(false);
  const hydratedForUserRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    const store = useEstablishmentStore.getState();

    if (!userId) {
      hydratedForUserRef.current = null;
      hydratedRef.current = false;
      store.clearSelectedEstablishment();
      return;
    }

    if (hydratedForUserRef.current !== userId) {
      hydratedForUserRef.current = userId;
      hydratedRef.current = false;
      store.clearSelectedEstablishment();
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
          "id, place_id, name, formatted_address, lat, lng, website, phone, rating, types",
        )
        .eq("id", establishmentId)
        .maybeSingle();

      if (error || !data) {
        const { data: list } = await supabase
          .from("establishments")
          .select(
            "id, place_id, name, formatted_address, lat, lng, website, phone, rating, types",
          )
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(1);
        const row = list?.[0];
        if (row) {
          const estab: EstablishmentData = {
            id: row.id,
            place_id: row.place_id,
            name: row.name ?? "",
            formatted_address: row.formatted_address ?? "",
            lat: row.lat ?? undefined,
            lng: row.lng ?? undefined,
            website: row.website ?? undefined,
            phone: row.phone ?? undefined,
            rating: row.rating ?? undefined,
            types: row.types ?? undefined,
          };
          useEstablishmentStore.getState().setSelectedEstablishment(estab);
          await useSmartStore.getState().fetchObjectives(establishmentId);
        }
        return;
      }

      const estab: EstablishmentData = {
        id: data.id,
        place_id: data.place_id,
        name: data.name ?? "",
        formatted_address: data.formatted_address ?? "",
        lat: data.lat ?? undefined,
        lng: data.lng ?? undefined,
        website: data.website ?? undefined,
        phone: data.phone ?? undefined,
        rating: data.rating ?? undefined,
        types: data.types ?? undefined,
      };
      useEstablishmentStore.getState().setSelectedEstablishment(estab);
      await useSmartStore.getState().fetchObjectives(establishmentId);
    })();
  }, [userId]);
}
