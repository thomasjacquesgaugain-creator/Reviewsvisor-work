import { authHeaders, SUPABASE_URL, checkSupabaseConfig } from '@/lib/supabaseClient';

export function makePlacesUrls(query: string, placeId?: string, session?: string) {
  const base = `${SUPABASE_URL}/functions/v1/places`;
  const token = session || (crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()));
  
  const auto = `${base}?type=autocomplete&input=${encodeURIComponent(query)}&sessiontoken=${token}`;
  const details = placeId ? `${base}?type=details&place_id=${encodeURIComponent(placeId)}` : "";
  
  return { auto, details, token };
}

export interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  international_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  url?: string;
}

export async function fetchPlaceDetails(place_id: string): Promise<PlaceDetails> {
  // Vérification de la config
  const configCheck = checkSupabaseConfig();
  if (!configCheck.valid) {
    throw new Error(configCheck.error);
  }

  const { details } = makePlacesUrls("", place_id);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const r = await fetch(details, { 
      method: "GET",
      signal: controller.signal,
      headers: await authHeaders()
    });
    clearTimeout(timeout);
    
    const data = await r.json();
    
    if (!r.ok) {
      // Détection spécifique des erreurs d'authentification
      if ((r.status === 401 || r.status === 403) && 
          (data?.error?.toLowerCase().includes('api key') || 
           data?.error?.toLowerCase().includes('invalid') ||
           data?.message?.toLowerCase().includes('api key'))) {
        throw new Error('Clé Supabase (anon) invalide. Mettez à jour VITE_SUPABASE_ANON_KEY dans Security.');
      }
      throw new Error(data?.error || `HTTP ${r.status}`);
    }
    
    if (data?.status && data.status !== "OK") {
      throw new Error(data?.error_message || data.status);
    }
    
    return data?.result;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
