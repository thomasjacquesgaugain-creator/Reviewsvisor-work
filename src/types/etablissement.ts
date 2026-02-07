export type Etab = {
  place_id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  url?: string;
  website?: string;
  phone?: string;
  phoneIntl?: string;
  mapsUrl?: string;
  rating?: number | null;
  is_active?: boolean;
  /** Catégorie mappée depuis Google Places types (Restaurant, Bar, Café, etc.) */
  type_etablissement?: string | null;
  /** Id de la ligne en BDD (pour mise à jour type_etablissement, etc.) */
  id?: string;
};

export const STORAGE_KEY = "mon-etablissement";
export const STORAGE_KEY_LIST = "mes-etablissements";
export const EVT_SAVED = "etab:saved";
export const EVT_LIST_UPDATED = "etabs:list-updated";
export const EVT_ESTABLISHMENT_UPDATED = "etab:updated";