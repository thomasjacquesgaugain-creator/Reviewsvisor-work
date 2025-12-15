import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number; error?: string } | null> {
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
      const errorData = await response.json();
      console.error('Token refresh failed:', JSON.stringify(errorData));
      
      if (errorData.error === 'invalid_grant') {
        return { error: 'invalid_grant', access_token: '', expires_in: 0 };
      }
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
    console.log('🚀 google-business-accounts: Starting...');
    
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
      console.error('❌ No Google connection found for user:', user.id);
      throw new Error('Google connection not found. Please connect your Google account first.');
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
        throw new Error('RECONNECT_REQUIRED: Refresh token not available.');
      }

      const newTokens = await refreshAccessToken(connection.refresh_token);
      
      if (!newTokens || newTokens.error) {
        console.log('🗑️ Clearing invalid tokens from database...');
        await supabase
          .from('google_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'google');
        
        throw new Error('RECONNECT_REQUIRED: Google access has been revoked. Please reconnect your account.');
      }

      accessToken = newTokens.access_token;

      // Update the access token in database
      const newExpiresAt = new Date(Date.now() + (newTokens.expires_in * 1000));
      const { error: updateError } = await supabase
        .from('google_connections')
        .update({
          access_token: accessToken,
          token_expires_at: newExpiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('provider', 'google');

      if (updateError) {
        console.error('Failed to update token:', updateError);
      } else {
        console.log('✅ Token refreshed successfully');
      }
    }

    // Use the new Business Profile API for accounts
    // API: https://mybusinessaccountmanagement.googleapis.com/v1/accounts
    console.log('📡 Fetching Google Business accounts from new API...');
    const accountsResponse = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text();
      console.error('❌ Failed to fetch accounts:', accountsResponse.status, errorText);
      
      if (accountsResponse.status === 401) {
        // Clear the connection and ask for reconnection
        await supabase
          .from('google_connections')
          .delete()
          .eq('user_id', user.id)
          .eq('provider', 'google');
        throw new Error('RECONNECT_REQUIRED: Google session expired. Please reconnect your Google account.');
      }
      
      if (accountsResponse.status === 403) {
        // Check if it's an API not enabled error
        if (errorText.includes('SERVICE_DISABLED') || errorText.includes('API has not been used')) {
          throw new Error('API_NOT_ENABLED: Veuillez activer "My Business Account Management API" dans votre console Google Cloud.');
        }
        throw new Error('Access denied. Assurez-vous que votre compte Google a accès à Google Business Profile.');
      }
      
      throw new Error(`Échec de la récupération des comptes Google Business: ${accountsResponse.status}`);
    }

    const accountsData = await accountsResponse.json();
    console.log('✅ Fetched accounts:', accountsData?.accounts?.length || 0);

    return new Response(
      JSON.stringify(accountsData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in google-business-accounts:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
