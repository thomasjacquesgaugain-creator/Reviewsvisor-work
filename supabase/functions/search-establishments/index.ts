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
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters long' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const googleMapsApiKey = Deno.env.get('GOOGLE_MAPS_KEY');
    if (!googleMapsApiKey) {
      console.error('Google Maps API key not found');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Search for places in France using Google Places API Text Search
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.append('query', query);
    searchUrl.searchParams.append('region', 'fr'); // Bias results to France
    searchUrl.searchParams.append('language', 'fr');
    searchUrl.searchParams.append('type', 'restaurant|cafe|bar|bakery|meal_takeaway|food');
    searchUrl.searchParams.append('key', googleMapsApiKey);

    console.log('Searching for establishments with query:', query);
    
    const response = await fetch(searchUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return new Response(
        JSON.stringify({ error: 'Error searching establishments' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Filter and format results
    const establishments = data.results
      ?.filter((place: PlaceResult) => {
        // Filter for establishments in France and relevant types
        const relevantTypes = ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway', 'food'];
        const hasRelevantType = place.types.some(type => relevantTypes.includes(type));
        const inFrance = place.formatted_address.toLowerCase().includes('france');
        return hasRelevantType && inFrance;
      })
      ?.slice(0, 5) // Limit to 5 suggestions
      ?.map((place: PlaceResult) => ({
        place_id: place.place_id,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        location: place.geometry.location,
        google_url: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
      })) || [];

    console.log(`Found ${establishments.length} establishments`);

    return new Response(
      JSON.stringify({ establishments }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in search-establishments function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});