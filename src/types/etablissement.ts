export type Etab = {
  place_id: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  url?: string;
  website?: string;
  phone?: string;
  rating?: number | null;
};

export const STORAGE_KEY = "mon-etablissement";
export const EVT_SAVED = "etab:saved";