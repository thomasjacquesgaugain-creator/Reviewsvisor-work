import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiter
const rateLimiter = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 1000;
const RATE_LIMIT_MAX = 10; // Higher limit for autocomplete

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(userId) || [];
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
      return new Response(
        JSON.stringify({ error: 'Too many requests', predictions: [] }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get query from URL params
    const url = new URL(req.url);
    const input = url.searchParams.get('input') || url.searchParams.get('q');
    const sessionToken = url.searchParams.get('sessionToken') || crypto.randomUUID();

    if (!input || input.length < 2) {
      return new Response(
        JSON.stringify({ predictions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get backend API key
    const apiKey = Deno.env.get('GOOGLE_MAPS_BACKEND_KEY');
    if (!apiKey) {
      console.error('GOOGLE_MAPS_BACKEND_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Maps API not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Places Autocomplete API
    const apiUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    apiUrl.searchParams.append('input', input);
    apiUrl.searchParams.append('types', 'establishment');
    apiUrl.searchParams.append('language', 'fr');
    apiUrl.searchParams.append('components', 'country:fr');
    apiUrl.searchParams.append('sessiontoken', sessionToken);
    apiUrl.searchParams.append('key', apiKey);

    console.log('Autocomplete search for:', input);

    const response = await fetch(apiUrl.toString());
    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places Autocomplete error:', data.status, data.error_message);
      
      // Handle specific errors
      if (data.status === 'REQUEST_DENIED') {
        return new Response(
          JSON.stringify({ 
            error: 'API key issue. Check Google Cloud Console restrictions.',
            predictions: [] 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: data.error_message || data.status, predictions: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Return predictions (already safe - no API key exposed)
    const predictions = (data.predictions || []).map((p: any) => ({
      place_id: p.place_id,
      description: p.description,
      main_text: p.structured_formatting?.main_text,
      secondary_text: p.structured_formatting?.secondary_text,
    }));

    console.log(`Found ${predictions.length} predictions for: ${input}`);

    return new Response(
      JSON.stringify({ predictions, sessionToken }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-places-autocomplete:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', predictions: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
