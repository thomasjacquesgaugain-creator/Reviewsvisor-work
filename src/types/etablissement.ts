export type Etab = {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number | null;
  url?: string;
  // Legacy fields for backward compatibility
  lat?: number | null;
  lng?: number | null;
};

export const STORAGE_KEY = "mon-etablissement";
export const STORAGE_KEY_LIST = "mes-etablissements";
export const EVT_SAVED = "etab:saved";
export const EVT_LIST_UPDATED = "etabs:list-updated";