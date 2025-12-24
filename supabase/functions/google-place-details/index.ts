import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache (24h TTL)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiter (5 requests per second)
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 1000; // 1 second
const RATE_LIMIT_MAX = 5;

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(userId) || [];
  
  // Remove old requests
  const validRequests = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT_MAX) {
    return true;
  }
  
  validRequests.push(now);
  rateLimiter.set(userId, validRequests);
  return false;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
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

    // Rate limiting
    if (isRateLimited(user.id)) {
      console.warn('Rate limit exceeded for user:', user.id);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get placeId from body (POST) or query params (GET)
    let placeId: string | null = null;
    
    if (req.method === 'POST') {
      const body = await req.json();
      placeId = body.placeId;
    } else {
      const url = new URL(req.url);
      placeId = url.searchParams.get('placeId') || url.searchParams.get('place_id');
    }

    if (!placeId) {
      console.error('Missing placeId parameter');
      return new Response(
        JSON.stringify({ error: 'Missing placeId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check cache first
    const cached = cache.get(placeId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached result for:', placeId);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get backend API key (NEVER exposed to frontend)
    const apiKey = Deno.env.get('GOOGLE_MAPS_BACKEND_KEY');
    if (!apiKey) {
      console.error('GOOGLE_MAPS_BACKEND_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Maps API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Places API
    const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    apiUrl.searchParams.append('place_id', placeId);
    apiUrl.searchParams.append('fields', [
      'place_id',
      'name',
      'formatted_address',
      'geometry/location',
      'international_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'url',
      'types',
    ].join(','));
    apiUrl.searchParams.append('language', 'fr');
    apiUrl.searchParams.append('key', apiKey);

    console.log('Fetching place details for:', placeId);

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Places API error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ 
          error: data.error_message || `Google Places API error: ${data.status}` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract only useful data (security: don't leak raw API response)
    const result = {
      place_id: data.result.place_id,
      name: data.result.name,
      address: data.result.formatted_address,
      lat: data.result.geometry?.location?.lat,
      lng: data.result.geometry?.location?.lng,
      phone: data.result.international_phone_number,
      website: data.result.website,
      rating: data.result.rating,
      user_ratings_total: data.result.user_ratings_total,
      url: data.result.url,
      types: data.result.types,
    };

    // Cache the result
    cache.set(placeId, { data: result, timestamp: Date.now() });

    console.log('Successfully retrieved place details for:', result.name);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-place-details:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
