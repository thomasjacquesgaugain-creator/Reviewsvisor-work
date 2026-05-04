import { useEstablishmentStore } from "@/store/establishmentStore";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
  formatted_address?: string | null;
  types?: string | string[] | null;
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
        formatted_address: selectedEstablishment.formatted_address ?? null,
        types: selectedEstablishment.types ?? null,
      }
    : null;
  return { establishment, loading: false };
}
