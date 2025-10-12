import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutocompleteResponse {
  predictions: Array<{
    description: string;
    place_id: string;
    structured_formatting: {
      main_text: string;
      secondary_text: string;
    };
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input, sessionToken } = await req.json();
    
    if (!input || input.trim().length < 2) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { 
          status: 200, 
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

    // Use Google Places Autocomplete API
    const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    url.searchParams.append('input', input);
    url.searchParams.append('types', 'establishment');
    url.searchParams.append('components', 'country:fr'); // France uniquement
    url.searchParams.append('language', 'fr');
    if (sessionToken) {
      url.searchParams.append('sessiontoken', sessionToken);
    }
    url.searchParams.append('key', googleMapsApiKey);

    console.log('Autocomplete request for:', input);
    
    const response = await fetch(url.toString());
    const data: AutocompleteResponse = await response.json();

    if (!response.ok) {
      console.error('Google Places API error:', data);
      return new Response(
        JSON.stringify({ error: 'Error fetching autocomplete suggestions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format suggestions
    const suggestions = (data.predictions || []).map((prediction) => ({
      description: prediction.description,
      place_id: prediction.place_id,
      structured: prediction.structured_formatting,
    }));

    console.log(`Found ${suggestions.length} autocomplete suggestions`);

    return new Response(
      JSON.stringify({ suggestions }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in autocomplete-establishments function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});