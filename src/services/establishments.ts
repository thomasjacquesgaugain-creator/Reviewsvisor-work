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

// Save venue from Google Place Details (new approach)
export async function saveVenueFromPlaceDetails(details: any): Promise<EstablishmentData> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Utilisateur non connecté');
  }

  const lat = details.geometry?.location?.lat();
  const lng = details.geometry?.location?.lng();

  // Map Google Places data to venues table
  const venueData = {
    owner_id: user.id,
    place_id: details.place_id!,
    name: details.name!,
    address: details.formatted_address,
    phone_number: details.international_phone_number,
    website: details.website,
    google_rating: details.rating,
    opening_hours: details.opening_hours,
    location: lat && lng ? `POINT(${lng} ${lat})` : null
  };

  console.log('Saving venue data:', venueData);

  // Upsert venue (avoid duplicates by place_id) - using type assertion for venues table
  const { data, error } = await (supabase as any)
    .from('venues')
    .upsert(venueData, {
      onConflict: 'place_id'
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving venue:', error);
    throw new Error('Erreur lors de la sauvegarde du venue : ' + error.message);
  }

  // Convert venue data to EstablishmentData format for compatibility
  const establishmentData: EstablishmentData = {
    id: data.id,
    user_id: data.owner_id,
    place_id: data.place_id,
    name: data.name,
    formatted_address: data.address,
    lat: lat,
    lng: lng,
    phone: data.phone_number,
    website: data.website,
    rating: data.google_rating,
    user_ratings_total: null,
    types: null,
    source: 'google',
    raw: details,
    created_at: data.created_at,
    updated_at: data.created_at
  };

  return establishmentData;
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

  // Update current establishment in profile
  if (data) {
    try {
      await updateCurrentEstablishment(data.id!);
    } catch (error) {
      console.warn('Could not update current establishment in profile:', error);
    }
  }

  return data as EstablishmentData;
}

// Save venue from Google Place ID (new approach)
export async function saveVenueFromPlaceId(placeId: string): Promise<EstablishmentData> {
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
        'opening_hours',
        'types'
      ]
    };

    service.getDetails(request, async (place: any, status: any) => {
      if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
        try {
          const savedVenue = await saveVenueFromPlaceDetails(place);
          resolve(savedVenue);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(new Error('Erreur lors de la récupération des détails du lieu'));
      }
    });
  });
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

export async function getCurrentEstablishment(): Promise<EstablishmentData | null> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Utilisateur non connecté');
  }

  // Try to get current establishment from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('current_establishment_id')
    .eq('user_id', user.id)
    .single();

  if (profile?.current_establishment_id) {
    const { data: establishment, error } = await supabase
      .from('establishments')
      .select('*')
      .eq('id', profile.current_establishment_id)
      .single();

    if (!error && establishment) {
      return establishment as EstablishmentData;
    }
  }

  // Fallback: get the most recent establishment
  const { data: establishments, error } = await supabase
    .from('establishments')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching current establishment:', error);
    return null;
  }

  return establishments && establishments.length > 0 ? establishments[0] as EstablishmentData : null;
}

export async function updateCurrentEstablishment(establishmentId: string): Promise<void> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Utilisateur non connecté');
  }

  // Upsert profile with current establishment
  const { error } = await supabase
    .from('profiles')
    .upsert({
      user_id: user.id,
      current_establishment_id: establishmentId
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error updating current establishment:', error);
    throw new Error('Erreur lors de la mise à jour de l\'établissement courant');
  }
}