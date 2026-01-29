import { useEstablishmentStore } from "@/store/establishmentStore";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
}

/**
 * Établissement actif : lecture depuis le store global (source unique).
 * L'hydratation est faite dans Protected via useHydrateActiveEstablishment.
 */
export function useCurrentEstablishment(): { establishment: CurrentEstablishment | null; loading: boolean } {
  const selectedEstablishment = useEstablishmentStore((s) => s.selectedEstablishment);
  const establishment: CurrentEstablishment | null = selectedEstablishment
    ? {
        id: selectedEstablishment.id ?? selectedEstablishment.place_id,
        name: selectedEstablishment.name,
        place_id: selectedEstablishment.place_id,
      }
    : null;
  return { establishment, loading: false };
}
