import { supabase } from '@/integrations/supabase/client';

export interface PlacePrediction {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  url?: string;
  types?: string[];
}

export interface GeocodeResult {
  formatted_address: string;
  lat: number;
  lng: number;
  place_id: string;
}

/**
 * Search for establishments using backend API (secure - no API key exposure)
 */
export async function searchEstablishments(
  query: string,
  sessionToken?: string
): Promise<{ predictions: PlacePrediction[]; sessionToken: string }> {
  if (!query || query.length < 2) {
    return { predictions: [], sessionToken: sessionToken || crypto.randomUUID() };
  }

  const { data, error } = await supabase.functions.invoke('google-places-autocomplete', {
    body: null,
    headers: {},
  });

  // We need to use GET with query params, so we'll use fetch directly
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  if (!token) {
    throw new Error('Vous devez être connecté pour rechercher un établissement');
  }

  const url = new URL(`https://zzjmtipdsccxmmoaetlp.supabase.co/functions/v1/google-places-autocomplete`);
  url.searchParams.append('input', query);
  if (sessionToken) {
    url.searchParams.append('sessionToken', sessionToken);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erreur lors de la recherche');
  }

  return {
    predictions: result.predictions || [],
    sessionToken: result.sessionToken || sessionToken || crypto.randomUUID(),
  };
}

/**
 * Get place details using backend API (secure - no API key exposure)
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const { data, error } = await supabase.functions.invoke('google-place-details', {
    body: { placeId },
  });

  if (error) {
    console.error('Error fetching place details:', error);
    throw new Error(error.message || 'Erreur lors de la récupération des détails');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as PlaceDetails;
}

/**
 * Geocode an address using backend API (secure - no API key exposure)
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const { data, error } = await supabase.functions.invoke('google-geocode', {
    body: { address },
  });

  if (error) {
    console.error('Error geocoding address:', error);
    throw new Error(error.message || 'Erreur lors du géocodage');
  }

  if (data.error) {
    throw new Error(data.error);
  }

  return data as GeocodeResult;
}

/**
 * Save establishment to database
 */
export async function saveEstablishment(place: PlaceDetails): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('Vous devez être connecté pour enregistrer un établissement');
  }

  const { error } = await supabase
    .from('establishments')
    .upsert({
      user_id: user.id,
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.address,
      lat: place.lat,
      lng: place.lng,
      phone: place.phone,
      website: place.website,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      source: 'google_places',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,place_id',
    });

  if (error) {
    console.error('Error saving establishment:', error);
    throw new Error('Erreur lors de l\'enregistrement de l\'établissement');
  }
}
