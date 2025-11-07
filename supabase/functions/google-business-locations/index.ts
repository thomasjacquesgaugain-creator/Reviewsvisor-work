import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountId } = await req.json();
    
    if (!accountId) {
      throw new Error('Account ID is required');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get access token
    const { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (connError || !connection) {
      throw new Error('Google connection not found');
    }

    // List locations with pagination
    const allLocations: any[] = [];
    let nextPageToken: string | null = null;

    do {
      const url = new URL(`https://mybusiness.googleapis.com/v4/${accountId}/locations`);
      url.searchParams.set('pageSize', '100');
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to fetch locations:', error);
        throw new Error('Failed to fetch locations');
      }

      const data = await response.json();
      if (data.locations) {
        allLocations.push(...data.locations);
      }
      nextPageToken = data.nextPageToken || null;
    } while (nextPageToken);

    return new Response(
      JSON.stringify({ locations: allLocations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error listing locations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
