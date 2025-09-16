import { useEstablishmentStore } from "@/store/establishmentStore";

export interface CurrentEstablishment {
  id: string;
  name: string;
  place_id: string;
}

export function useCurrentEstablishment(): CurrentEstablishment | null {
  const { selectedEstablishment } = useEstablishmentStore();
  
  if (!selectedEstablishment) {
    return null;
  }
  
  return {
    id: selectedEstablishment.place_id, // Using place_id as the unique identifier
    name: selectedEstablishment.name,
    place_id: selectedEstablishment.place_id,
  };
}