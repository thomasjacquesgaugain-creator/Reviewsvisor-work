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
      .select('access_token, token_expires_at, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (connError || !connection) {
      throw new Error('Google connection not found. Please connect your Google account first.');
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
      // Refresh token logic would go here
      console.log('Token expired, would refresh here');
    }

    // List accounts
    const accountsResponse = await fetch('https://mybusiness.googleapis.com/v4/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!accountsResponse.ok) {
      const error = await accountsResponse.text();
      console.error('Failed to fetch accounts:', error);
      throw new Error('Failed to fetch Google Business accounts');
    }

    const accounts = await accountsResponse.json();

    return new Response(
      JSON.stringify(accounts),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error listing accounts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
