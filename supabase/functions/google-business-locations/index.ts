import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Missing credentials for token refresh');
    return null;
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Token refresh failed:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 google-business-locations: Starting...');
    
    const { accountId } = await req.json();
    
    if (!accountId) {
      throw new Error('Account ID is required');
    }

    console.log('📍 Account ID received:', accountId);

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
      console.error('❌ User auth failed:', userError);
      throw new Error('Unauthorized');
    }

    console.log('✅ User authenticated:', user.id);

    // Get access token and refresh token
    const { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('access_token, token_expires_at, refresh_token')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (connError || !connection) {
      console.error('❌ No Google connection found');
      throw new Error('Google connection not found');
    }

    console.log('✅ Google connection found');

    let accessToken = connection.access_token;

    // Check if token needs refresh (with 5 minute buffer)
    const tokenExpiresAt = connection.token_expires_at ? new Date(connection.token_expires_at) : null;
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (tokenExpiresAt && tokenExpiresAt < fiveMinutesFromNow) {
      console.log('🔄 Token expired or expiring soon, refreshing...');
      
      if (!connection.refresh_token) {
        throw new Error('Refresh token not available. Please reconnect your Google account.');
      }

      const newTokens = await refreshAccessToken(connection.refresh_token);
      
      if (!newTokens) {
        throw new Error('Failed to refresh access token. Please reconnect your Google account.');
      }

      accessToken = newTokens.access_token;

      // Update the access token in database
      const newExpiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));
      await supabase
        .from('google_connections')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', 'google');

      console.log('✅ Token refreshed successfully');
    }

    // Use the new Business Profile API for locations
    // The accountId format from the new API is "accounts/123456789"
    // We need to use the businessbusinessinformation API
    const allLocations: any[] = [];
    let nextPageToken: string | null = null;

    do {
      // Build the URL for the new Business Profile API
      // Format: https://mybusinessbusinessinformation.googleapis.com/v1/{account}/locations
      const url = new URL(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations`);
      url.searchParams.set('pageSize', '100');
      url.searchParams.set('readMask', 'name,title,storefrontAddress');
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken);
      }

      console.log('📍 Fetching locations from:', url.pathname);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to fetch locations:', response.status, errorText);
        
        if (response.status === 401) {
          throw new Error('RECONNECT_REQUIRED: Google session expired. Please reconnect your Google account.');
        }
        
        if (response.status === 403) {
          throw new Error('Access denied. Make sure your Google account has access to this business.');
        }
        
        throw new Error(`Failed to fetch locations: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Locations response:', {
        locationsCount: data.locations?.length || 0,
        hasNextPage: !!data.nextPageToken
      });

      if (data.locations) {
        // Map the new API format to the expected format
        const mappedLocations = data.locations.map((loc: any) => ({
          name: loc.name, // Format: "locations/123456789"
          locationName: loc.title || loc.name,
          address: loc.storefrontAddress ? {
            addressLines: [
              loc.storefrontAddress.addressLines?.join(', '),
              loc.storefrontAddress.locality,
              loc.storefrontAddress.postalCode
            ].filter(Boolean)
          } : undefined
        }));
        allLocations.push(...mappedLocations);
      }
      nextPageToken = data.nextPageToken || null;
    } while (nextPageToken);

    console.log('✅ Fetched locations total:', allLocations.length);

    return new Response(
      JSON.stringify({ locations: allLocations }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in google-business-locations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
