import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Mapping du primaryType Google vers nos catégories Reviewsvisor
 * La nouvelle API retourne des types plus précis !
 */
function mapPrimaryTypeToCategory(primaryType: string | null | undefined, types: string[] = []): string {
  console.log('[get-place-details] primaryType:', primaryType);
  console.log('[get-place-details] types:', types);
  
  if (!primaryType && (!types || types.length === 0)) return "Autre";
  
  const typeToCheck = primaryType?.toLowerCase() || '';
  const allTypes = [typeToCheck, ...types.map(t => t.toLowerCase())].filter(Boolean);
  
  for (const t of allTypes) {
    // Restaurant
    if (t.includes('restaurant') || t === 'food' || t === 'meal_delivery' || t === 'meal_takeaway' || 
        t === 'fast_food' || t === 'fine_dining' || t === 'pizzeria' || t === 'sushi' ||
        t === 'steak_house' || t === 'seafood' || t === 'buffet' || t === 'diner' ||
        t === 'food_court' || t === 'sandwich_shop' || t === 'deli' || t === 'caterer') {
      return 'Restaurant';
    }
    
    // Bar
    if (t === 'bar' || t === 'night_club' || t === 'nightclub' || t === 'pub' || 
        t === 'wine_bar' || t === 'cocktail_bar' || t === 'brewery' || t === 'sports_bar' ||
        t === 'beer_garden' || t === 'lounge' || t === 'karaoke' || t === 'disco') {
      return 'Bar';
    }
    
    // Café
    if (t === 'cafe' || t === 'coffee_shop' || t === 'coffee' || t === 'tea_house' || 
        t === 'tea_room' || t === 'espresso_bar' || t === 'bubble_tea') {
      return 'Café';
    }
    
    // Salon de coiffure
    if (t === 'hair_care' || t === 'hair_salon' || t === 'hairdresser' || 
        t === 'barber_shop' || t === 'barber' || t === 'barbershop') {
      return 'Salon de coiffure';
    }
    
    // Spa / Bien-être
    if (t === 'spa' || t === 'beauty_salon' || t === 'nail_salon' || t === 'skin_care' ||
        t === 'massage' || t === 'wellness_center' || t === 'yoga_studio' || t === 'pilates' ||
        t === 'gym' || t === 'fitness_center' || t === 'health_club' || t === 'health' ||
        t === 'tanning_salon' || t === 'tattoo' || t === 'piercing' || t === 'waxing' ||
        t === 'esthetician' || t === 'day_spa' || t === 'sauna' || t === 'physical_therapy' ||
        t === 'physiotherapist' || t === 'sports_club' || t === 'athletic_club') {
      return 'Spa / Bien-être';
    }
    
    // Hôtel
    if (t === 'lodging' || t === 'hotel' || t === 'motel' || t === 'resort' ||
        t === 'bed_and_breakfast' || t === 'guest_house' || t === 'hostel' ||
        t === 'campground' || t === 'inn' || t === 'lodge' || t === 'vacation_rental') {
      return 'Hôtel';
    }
    
    // Boulangerie
    if (t === 'bakery' || t === 'pastry_shop' || t === 'patisserie' || t === 'cake_shop' ||
        t === 'donut_shop' || t === 'bagel_shop' || t === 'confectionery' || t === 'chocolate_shop') {
      return 'Boulangerie';
    }
    
    // Commerce de détail
    if (t === 'store' || t === 'shop' || t === 'shopping_mall' || t === 'department_store' ||
        t === 'supermarket' || t === 'grocery_store' || t === 'convenience_store' ||
        t === 'clothing_store' || t === 'shoe_store' || t === 'jewelry_store' ||
        t === 'electronics_store' || t === 'hardware_store' || t === 'furniture_store' ||
        t === 'book_store' || t === 'pet_store' || t === 'florist' || t === 'pharmacy' ||
        t === 'drugstore' || t === 'gift_shop' || t === 'sporting_goods_store' ||
        t === 'car_dealer' || t === 'car_rental' || t === 'car_repair' || t === 'car_wash' ||
        t === 'gas_station' || t === 'laundry' || t === 'dry_cleaner') {
      return 'Commerce de détail';
    }
  }
  
  return "Autre";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const url = new URL(req.url);
    const placeId = url.searchParams.get('placeId') || url.searchParams.get('place_id');
    
    if (!placeId) {
      console.error('Missing placeId parameter');
      return new Response(
        JSON.stringify({ error: 'Missing placeId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleMapsApiKey =
      Deno.env.get('CLE_API_GOOGLE_MAPS') ||
      Deno.env.get('GOOGLE_PLACES_API_KEY') ||
      Deno.env.get('GOOGLE_API_KEY');
      
    if (!googleMapsApiKey) {
      console.error('[get-place-details] No Google API key found.');
      return new Response(
        JSON.stringify({
          error: 'Google Maps API key not configured',
          hint: 'Configure CLE_API_GOOGLE_MAPS in Supabase Dashboard → Project Settings → Edge Functions → Secrets',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // NOUVELLE API GOOGLE PLACES (v1) - retourne primaryType !
    // =========================================================================
    const newApiUrl = `https://places.googleapis.com/v1/places/${placeId}`;
    
    // Champs à récupérer avec la nouvelle API
    const fieldMask = [
      'id',
      'displayName',
      'formattedAddress',
      'location',
      'internationalPhoneNumber',
      'nationalPhoneNumber',
      'websiteUri',
      'rating',
      'userRatingCount',
      'regularOpeningHours',
      'types',
      'primaryType',           // ← Le type principal (ex: "gym", "nail_salon")
      'primaryTypeDisplayName', // ← Le nom affiché localisé (ex: "Salle de sport")
      'googleMapsUri',
    ].join(',');

    console.log('[get-place-details] Calling NEW Places API for:', placeId);

    const response = await fetch(newApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': googleMapsApiKey,
        'X-Goog-FieldMask': fieldMask,
        'Accept-Language': 'fr', // Pour avoir primaryTypeDisplayName en français
      },
    });

    const data = await response.json();

    console.log('[get-place-details] New API response status:', response.status);
    console.log('[get-place-details] primaryType:', data.primaryType);
    console.log('[get-place-details] primaryTypeDisplayName:', data.primaryTypeDisplayName);
    console.log('[get-place-details] types:', data.types);

    if (!response.ok) {
      console.error('[get-place-details] New API error:', data);
      
      // Fallback vers l'ancienne API si la nouvelle échoue
      console.log('[get-place-details] Falling back to legacy API...');
      return await callLegacyApi(placeId, googleMapsApiKey);
    }

    // Mapper le primaryType vers notre catégorie
    const primaryType = data.primaryType || null;
    const types = data.types || [];
    const typeEtablissement = mapPrimaryTypeToCategory(primaryType, types);
    
    console.log('[get-place-details] type_etablissement mappé:', typeEtablissement);

    // Construire la réponse dans le format attendu par le frontend
    const result = {
      place_id: data.id || placeId,
      name: data.displayName?.text || data.displayName || '',
      formatted_address: data.formattedAddress || '',
      geometry: data.location ? {
        location: {
          lat: data.location.latitude,
          lng: data.location.longitude,
        }
      } : null,
      international_phone_number: data.internationalPhoneNumber || data.nationalPhoneNumber || null,
      website: data.websiteUri || null,
      rating: data.rating || null,
      user_ratings_total: data.userRatingCount || null,
      opening_hours: data.regularOpeningHours ? {
        weekday_text: data.regularOpeningHours.weekdayDescriptions || [],
      } : null,
      url: data.googleMapsUri || null,
      // Types
      types: types,
      primaryType: primaryType,
      primaryTypeDisplayName: data.primaryTypeDisplayName?.text || data.primaryTypeDisplayName || null,
      // Notre catégorie mappée
      type_etablissement: typeEtablissement,
    };

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    const err = error as Error;
    console.error('[get-place-details] Exception:', err?.message, err);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: err?.message || String(error),
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Fallback vers l'ancienne API Google Places si la nouvelle échoue
 */
async function callLegacyApi(placeId: string, googleMapsApiKey: string): Promise<Response> {
  console.log('[get-place-details] Using LEGACY API for:', placeId);
  
  const fields = 'place_id,name,formatted_address,geometry/location,international_phone_number,formatted_phone_number,website,rating,user_ratings_total,opening_hours/weekday_text,types,url';
  const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  apiUrl.searchParams.set('place_id', placeId);
  apiUrl.searchParams.set('fields', fields);
  apiUrl.searchParams.set('language', 'fr');
  apiUrl.searchParams.set('key', googleMapsApiKey);

  const response = await fetch(apiUrl.toString());
  const data = await response.json();

  console.log('[get-place-details] Legacy API response:', response.status, data.status);

  if (!response.ok || (data.status && data.status !== 'OK')) {
    return new Response(
      JSON.stringify({
        error: 'Google Places API error',
        googleStatus: data.status,
        googleError: data.error_message,
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const result = data.result || null;
  const types = result?.types || [];
  const typeEtablissement = mapPrimaryTypeToCategory(null, types);
  
  console.log('[get-place-details] Legacy type_etablissement:', typeEtablissement);

  const responsePayload = result
    ? { ...result, type_etablissement: typeEtablissement }
    : null;

  return new Response(
    JSON.stringify({ result: responsePayload }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}