import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceDetailsResponse {
  result: {
    place_id: string;
    name: string;
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    international_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    opening_hours?: {
      weekday_text: string[];
    };
    types: string[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const placeId = url.searchParams.get('placeId') || url.searchParams.get('place_id');
    const sessionToken = url.searchParams.get('sessionToken');
    
    if (!placeId) {
      console.error('Missing placeId parameter');
      return new Response(
        JSON.stringify({ error: 'Missing placeId parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const googleMapsApiKey = Deno.env.get('CLE_API_GOOGLE_MAPS');
    if (!googleMapsApiKey) {
      console.error('CLE_API_GOOGLE_MAPS not found');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use Google Places Details API
    const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    apiUrl.searchParams.append('place_id', placeId);
    apiUrl.searchParams.append('fields', [
      'place_id',
      'name',
      'formatted_address',
      'geometry/location',
      'international_phone_number',
      'formatted_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'opening_hours/weekday_text',
      'types',
      'url',
    ].join(','));
    apiUrl.searchParams.append('language', 'fr');
    if (sessionToken) {
      apiUrl.searchParams.append('sessiontoken', sessionToken);
    }
    apiUrl.searchParams.append('key', googleMapsApiKey);

    console.log('Place details request for place_id:', placeId);
    
    const response = await fetch(apiUrl.toString());
    const data: PlaceDetailsResponse = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      return new Response(
        JSON.stringify({ error: 'Error fetching place details' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Successfully retrieved place details for:', data.result?.name);

    return new Response(
      JSON.stringify({ result: data.result || null }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in get-place-details function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});