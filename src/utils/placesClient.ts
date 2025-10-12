export function makePlacesUrls(query: string, placeId?: string, session?: string) {
  const supabaseUrl = "https://zzjmtipdsccxmmoaetlp.supabase.co";
  const base = `${supabaseUrl}/functions/v1/places`;
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
  const { details } = makePlacesUrls("", place_id);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  
  try {
    const r = await fetch(details, { 
      method: "GET",
      signal: controller.signal,
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU'
      }
    });
    clearTimeout(timeout);
    
    const data = await r.json();
    if (!r.ok) throw new Error(data?.error || `HTTP ${r.status}`);
    if (data?.status && data.status !== "OK") {
      throw new Error(data?.error_message || data.status);
    }
    
    return data?.result;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}
