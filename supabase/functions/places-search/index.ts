import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  types: string[];
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
}

// Function to extract place_id from Google Maps URL
function extractPlaceIdFromUrl(url: string): string | null {
  const patterns = [
    /place_id:([a-zA-Z0-9_-]+)/,
    /data=.*?!1s([a-zA-Z0-9_-]+)/,
    /ftid=([a-zA-Z0-9_-]+)/,
    /place\/[^\/]+\/@[^\/]+\/data=.*?!1s([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// Function to get place details
async function getPlaceDetails(placeId: string, apiKey: string) {
  try {
    const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    detailsUrl.searchParams.append('place_id', placeId);
    detailsUrl.searchParams.append('fields', 'place_id,name,formatted_address,geometry,rating,user_ratings_total,website,formatted_phone_number,business_status,types');
    detailsUrl.searchParams.append('language', 'fr');
    detailsUrl.searchParams.append('key', apiKey);

    const response = await fetch(detailsUrl.toString());
    const data = await response.json();

    if (data.status === 'OK' && data.result) {
      return {
        place_id: data.result.place_id,
        name: data.result.name,
        formatted_address: data.result.formatted_address,
        location: data.result.geometry?.location || { lat: 0, lng: 0 },
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        business_status: data.result.business_status,
        website: data.result.website,
        phone: data.result.formatted_phone_number,
        source: "google-places"
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit') || '8');
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const googlePlacesApiKey = Deno.env.get('GOOGLE_MAPS_KEY');
    if (!googlePlacesApiKey) {
      console.error('Google Places API key not found');
      return new Response(
        JSON.stringify({ error: 'Google Places API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if query is a Google Maps URL
    const isUrl = query.includes('maps.google') || query.includes('goo.gl');
    
    if (isUrl) {
      // Handle Google Maps URL
      const placeId = extractPlaceIdFromUrl(query);
      if (!placeId) {
        return new Response(
          JSON.stringify({ error: 'Could not extract place ID from URL' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const placeDetails = await getPlaceDetails(placeId, googlePlacesApiKey);
      if (!placeDetails) {
        return new Response(
          JSON.stringify({ error: 'Could not fetch place details' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({ items: [placeDetails] }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Search for places using Google Places Text Search
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', query);
    searchUrl.searchParams.append('region', 'fr'); // Bias results to France
    searchUrl.searchParams.append('language', 'fr');
    searchUrl.searchParams.append('type', 'restaurant|cafe|bar|bakery|meal_takeaway|food|establishment');
    searchUrl.searchParams.append('key', googlePlacesApiKey);

    console.log('Searching for places with query:', query);
    
    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.status === 'REQUEST_DENIED') {
      console.error('Google Places API error - REQUEST_DENIED:', data.error_message);
      return new Response(
        JSON.stringify({ 
          error: 'API request denied. Please check if Places API is enabled and key restrictions.',
          code: 'REQUEST_DENIED'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (data.status === 'OVER_QUERY_LIMIT') {
      console.error('Google Places API quota exceeded');
      return new Response(
        JSON.stringify({ 
          error: 'API quota exceeded. Please try again later.',
          code: 'OVER_QUERY_LIMIT'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ error: 'Error searching places', code: data.status }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter and format results
    const places = data.results
      ?.slice(0, limit) // Limit results
      ?.map((place: PlaceResult) => ({
        place_id: place.place_id,
        name: place.name,
        formatted_address: place.formatted_address,
        location: place.geometry.location,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        business_status: place.business_status,
        source: "google-places"
      })) || [];

    console.log(`Found ${places.length} places`);

    return new Response(
      JSON.stringify({ items: places }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in places-search function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});