import { supabase } from "@/integrations/supabase/client";
import { loadGoogleMaps } from "@/lib/loadGoogleMaps";
import { syncEstablishmentBilling } from "@/lib/establishmentBilling";

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
  type_etablissement?: string | null;
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
    
    // Sync billing with Stripe (background, don't block)
    syncEstablishmentBilling().then(result => {
      if (result.success) {
        console.log('Billing synced:', result);
      } else {
        console.warn('Billing sync failed:', result.error);
      }
    }).catch(err => console.warn('Billing sync error:', err));
  }

  return data as EstablishmentData;
}

// Simple function to save selected place by place_id
export async function saveSelectedPlace(placeId: string): Promise<void> {
  try {
    console.log('Saving selected place:', placeId);
    const savedVenue = await saveVenueFromPlaceId(placeId);
    console.log('Place saved successfully:', savedVenue);
    alert('Établissement enregistré ✅');
  } catch (error) {
    console.error('Error saving place:', error);
    alert('Erreur lors de l\'enregistrement : ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
  }
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

/**
 * Charge les établissements enregistrés de l'utilisateur depuis la table établissements (source de vérité).
 * Même source que /etablissement (SavedEstablishmentsList) et le sélecteur du Dashboard.
 */
export async function getUserEstablishments(): Promise<EstablishmentData[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Utilisateur non connecté');
  }

  const { data, error } = await supabase
    .from('établissements')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching establishments:', error);
    throw new Error('Erreur lors de la récupération des établissements');
  }

  const rows = (data || []) as Array<{
    id: string;
    place_id: string;
    nom: string;
    adresse: string | null;
    lat: number | null;
    lng: number | null;
    telephone: string | null;
    website: string | null;
    rating: number | null;
    user_ratings_total: number | null;
    type_etablissement: string | null;
    created_at: string;
    updated_at: string;
    is_active?: boolean | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    place_id: row.place_id,
    name: row.nom,
    formatted_address: row.adresse ?? undefined,
    lat: row.lat ?? undefined,
    lng: row.lng ?? undefined,
    phone: row.telephone ?? undefined,
    website: row.website ?? undefined,
    rating: row.rating ?? undefined,
    user_ratings_total: row.user_ratings_total ?? undefined,
    type_etablissement: row.type_etablissement ?? undefined,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export type UpdateEstablishmentPayload = {
  name?: string;
  formatted_address?: string;
  phone?: string;
  website?: string;
  type_etablissement?: string | null;
};

/**
 * Met à jour un établissement (nom, adresse, téléphone, site web, type_etablissement) dans la table établissements.
 * L'établissement doit appartenir à l'utilisateur connecté.
 */
export async function updateEstablishment(
  establishmentId: string,
  payload: UpdateEstablishmentPayload
): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error('Utilisateur non connecté');
  }

  const update: Record<string, unknown> = {};
  if (payload.name !== undefined) update.nom = payload.name.trim() || null;
  if (payload.formatted_address !== undefined) update.adresse = payload.formatted_address.trim() || null;
  if (payload.phone !== undefined) update.telephone = payload.phone.trim() || null;
  if (payload.website !== undefined) update.website = payload.website.trim() || null;
  if (payload.type_etablissement !== undefined) update.type_etablissement = payload.type_etablissement?.trim() || null;

  if (Object.keys(update).length === 0) return;

  console.log('[updateEstablishment] Données envoyées à Supabase:', {
    table: 'établissements',
    establishmentId,
    user_id: user.id,
    update,
  });

  const { data, error } = await supabase
    .from('établissements')
    .update(update)
    .eq('id', establishmentId)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle();

  if (error) {
    const fullError = {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    };
    console.error('[updateEstablishment] Erreur Supabase complète:', fullError);
    console.error('Supabase error:', error.message, error.details, error.hint);
    throw new Error(
      error.hint || error.message || 'Erreur lors de la mise à jour de l\'établissement'
    );
  }

  if (data === null && !error) {
    console.warn('[updateEstablishment] Aucune ligne mise à jour (id ou user_id ne correspondent peut-être pas, ou RLS bloque)');
  }
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
      .eq('user_id', user.id)
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

export async function upsertUserEstablishmentFromProfile(input: {
  name: string;
  formatted_address: string | null;
}): Promise<EstablishmentData> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error('Utilisateur non connecté');
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error("Nom d'établissement manquant");
  }

  // Try to update current establishment if it exists
  const existing = await getCurrentEstablishment().catch(() => null);

  if (existing?.id) {
    const { data, error } = await supabase
      .from('establishments')
      .update({
        name,
        formatted_address: input.formatted_address,
      })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating establishment:', error);
      throw new Error("Erreur lors de la mise à jour de l'établissement");
    }

    await updateCurrentEstablishment(data.id);
    return data as EstablishmentData;
  }

  // Else: create a new minimal establishment
  const placeId = `manual_${user.id}`;

  const { data, error } = await supabase
    .from('establishments')
    .insert({
      user_id: user.id,
      place_id: placeId,
      name,
      formatted_address: input.formatted_address,
      source: 'manual',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creating establishment:', error);
    throw new Error("Erreur lors de la création de l'établissement");
  }

  await updateCurrentEstablishment(data.id);
  return data as EstablishmentData;
}