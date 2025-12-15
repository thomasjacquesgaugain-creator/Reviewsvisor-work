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
    const { code, redirectUri } = await req.json();
    
    if (!code) {
      throw new Error('Authorization code is required');
    }

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    // Use provided redirectUri or fallback to configured one
    const finalRedirectUri = redirectUri || Deno.env.get('AUTH_REDIRECT') || 'https://reviewsvisor.fr/api/auth/callback/google';

    console.log('🔐 OAuth callback - using redirect URI:', finalRedirectUri);

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: finalRedirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();
    console.log('✅ Tokens received:', { 
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expires_in
    });
    
    // Get user from auth header
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

    console.log('✅ User authenticated:', user.id);

    // Calculate token expiration
    const tokenExpiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('google_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .maybeSingle();

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('google_connections')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || undefined, // Only update if new refresh token provided
          token_expires_at: tokenExpiresAt.toISOString(),
          scope: tokens.scope || 'https://www.googleapis.com/auth/business.manage',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw new Error('Failed to update connection');
      }
      console.log('✅ Existing connection updated');
    } else {
      // Insert new connection
      const { error: insertError } = await supabase
        .from('google_connections')
        .insert({
          user_id: user.id,
          provider: 'google',
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: tokenExpiresAt.toISOString(),
          scope: tokens.scope || 'https://www.googleapis.com/auth/business.manage',
        });

      if (insertError) {
        console.error('Database insert error:', insertError);
        throw new Error('Failed to save connection');
      }
      console.log('✅ New connection created');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
