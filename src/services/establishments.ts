import { supabase } from "@/integrations/supabase/client";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";

export interface EstablishmentData {
  id?: string;
  user_id?: string;
  place_id: string;
  name: string;
  formatted_address?: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: any;
  source?: string;
  raw?: any;
  created_at?: string;
  updated_at?: string;
}

export async function saveEstablishmentFromPlaceDetails(details: any): Promise<EstablishmentData> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Utilisateur non connecté');
  }

  // Map Google Places data to our establishment structure
  const establishmentData = {
    user_id: user.id,
    place_id: details.place_id!,
    name: details.name!,
    formatted_address: details.formatted_address,
    lat: details.geometry?.location?.lat(),
    lng: details.geometry?.location?.lng(),
    phone: details.international_phone_number,
    website: details.website,
    rating: details.rating,
    user_ratings_total: details.user_ratings_total,
    types: details.types,
    source: 'google',
    raw: details
  };

  // Upsert establishment (avoid duplicates by user_id + place_id)
  const { data, error } = await supabase
    .from('establishments')
    .upsert(establishmentData, {
      onConflict: 'user_id,place_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving establishment:', error);
    throw new Error('Erreur lors de la sauvegarde de l\'établissement');
  }

  return data as EstablishmentData;
}

export async function saveEstablishmentFromPlaceId(placeId: string): Promise<EstablishmentData> {
  // Ensure Google Maps is loaded
  await loadGoogleMaps();
  
  const service = new (window as any).google.maps.places.PlacesService(document.createElement('div'));
  
  return new Promise((resolve, reject) => {
    const request = {
      placeId,
      fields: [
        'place_id',
        'name',
        'formatted_address',
        'geometry.location',
        'international_phone_number',
        'website',
        'rating',
        'user_ratings_total',
        'types'
      ]
    };

    service.getDetails(request, async (place: any, status: any) => {
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
        try {
          const savedEstablishment = await saveEstablishmentFromPlaceDetails(place);
          resolve(savedEstablishment);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Erreur lors de la récupération des détails du lieu'));
      }
    });
  });
}

export async function getUserEstablishments(): Promise<EstablishmentData[]> {
  const { data, error } = await supabase
    .from('establishments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching establishments:', error);
    throw new Error('Erreur lors de la récupération des établissements');
  }

  return (data || []) as EstablishmentData[];
}