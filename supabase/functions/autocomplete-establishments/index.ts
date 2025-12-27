import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const input = url.searchParams.get('input') || url.searchParams.get('q') || url.searchParams.get('query');
    const sessionToken = url.searchParams.get('sessionToken');
    
    if (!input || input.trim().length < 2) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { 
          status: 200, 
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

    // Use Google Places Autocomplete API - worldwide search
    const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    apiUrl.searchParams.append('input', input);
    apiUrl.searchParams.append('types', 'establishment');
    if (sessionToken) {
      apiUrl.searchParams.append('sessiontoken', sessionToken);
    }
    apiUrl.searchParams.append('key', googleMapsApiKey);

    console.log('Autocomplete request for:', input);
    
    const response = await fetch(apiUrl.toString());
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
