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
    console.log('🚀 google-business-reviews: Starting import...');
    
    const { accountId, locationId, placeId } = await req.json();
    
    console.log('📥 Import request received:', {
      accountId: accountId?.substring(0, 30) + '...',
      locationId: locationId?.substring(0, 30) + '...',
      placeId
    });
    
    if (!accountId || !locationId) {
      console.error('❌ Missing required parameters');
      throw new Error('Account ID and Location ID are required');
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
      console.error('❌ Google connection not found for user:', user.id, connError);
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

    console.log('✅ Access token ready');

    // Fetch reviews using the new Business Profile API
    // The locationId format is "locations/123456789" from the new API
    // We need to use: https://mybusiness.googleapis.com/v4/{parent=accounts/*/locations/*}/reviews
    // Or the new API at: https://mybusinessreviews.googleapis.com/v1/{parent}/reviews
    const allReviews: any[] = [];
    let nextPageToken: string | null = null;

    do {
      // Build the full resource name for reviews
      // Format: accounts/{accountId}/locations/{locationId}/reviews
      // The accountId comes as "accounts/123" and locationId as "locations/456"
      const parent = `${accountId}/${locationId}`;
      const url = new URL(`https://mybusiness.googleapis.com/v4/${parent}/reviews`);
      url.searchParams.set('pageSize', '100');
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken);
      }

      console.log('🔍 Fetching reviews from:', url.pathname);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText.substring(0, 500)
        });
        
        if (response.status === 401) {
          throw new Error('Google session expired. Please reconnect your Google account.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Make sure your Google account has access to this business.');
        }
        if (response.status === 404) {
          // Try alternative endpoint for reviews
          console.log('📍 Trying alternative reviews API endpoint...');
          break;
        }
        if (response.status === 429) {
          throw new Error('Too many requests to Google. Please try again in a few minutes.');
        }
        
        throw new Error(`Failed to fetch reviews from Google Business: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 Response from Google:', {
        hasReviews: !!data.reviews,
        reviewsCount: data.reviews?.length || 0,
        hasNextPage: !!data.nextPageToken
      });

      if (data.reviews) {
        allReviews.push(...data.reviews);
      }
      nextPageToken = data.nextPageToken || null;
    } while (nextPageToken);

    console.log(`✅ Fetched ${allReviews.length} reviews from Google Business`);

    // Upsert reviews to database
    let insertedCount = 0;
    let updatedCount = 0;

    if (allReviews.length === 0) {
      console.log('⚠️ No reviews to import from Google Business');
      return new Response(
        JSON.stringify({
          success: true,
          total: 0,
          inserted: 0,
          updated: 0,
          message: 'Aucun avis Google trouvé pour cet établissement'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`💾 Starting to insert ${allReviews.length} reviews into database...`);

    for (const review of allReviews) {
      const externalId = review.reviewId || review.name;
      
      const reviewData = {
        user_id: user.id,
        place_id: placeId || `gb:${locationId}`,
        source: 'google',
        source_review_id: externalId,
        review_id_ext: externalId,
        author_name: review.reviewer?.displayName,
        author: review.reviewer?.displayName,
        rating: review.starRating === 'FIVE' ? 5 :
                review.starRating === 'FOUR' ? 4 :
                review.starRating === 'THREE' ? 3 :
                review.starRating === 'TWO' ? 2 :
                review.starRating === 'ONE' ? 1 : null,
        text: review.comment,
        create_time: review.createTime,
        update_time: review.updateTime,
        published_at: review.createTime,
        owner_reply_text: review.reviewReply?.comment,
        owner_reply_time: review.reviewReply?.updateTime,
        raw: review,
      };

      // Check if review already exists by external ID
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.id)
        .eq('review_id_ext', externalId)
        .single();

      if (existing) {
        // RÈGLE CRITIQUE : Si l'avis existe, PRÉSERVER son createTime original
        // Charger l'avis existant pour récupérer son createTime
        const { data: existingReviewData } = await supabase
          .from('reviews')
          .select('create_time, raw')
          .eq('id', existing.id)
          .single();
        
        // PRÉSERVER createTime original (NE JAMAIS L'ÉCRASER)
        const preservedCreateTime = existingReviewData?.create_time || existingReviewData?.raw?.createTime || review.createTime;
        const preservedOriginalCreateTime = existingReviewData?.raw?.originalCreateTime || existingReviewData?.raw?.createTime || review.createTime;
        
        // Update existing review EN PRÉSERVANT createTime
        const { error: updateError } = await supabase
          .from('reviews')
          .update({
            ...reviewData,
            create_time: preservedCreateTime, // PRÉSERVER createTime original
            inserted_at: undefined,
            raw: {
              ...reviewData.raw,
              createTime: preservedCreateTime, // PRÉSERVER createTime original
              originalCreateTime: preservedOriginalCreateTime // PRÉSERVER backup
            }
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('❌ Failed to update review:', updateError);
          continue;
        }
        updatedCount++;
      } else {
        // Insert new review
        const { error: insertError } = await supabase
          .from('reviews')
          .insert(reviewData);

        if (insertError) {
          console.error('❌ Failed to insert review:', insertError);
          continue;
        }
        insertedCount++;
      }
    }

    console.log(`✅ Import complete: ${insertedCount} inserted, ${updatedCount} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        total: allReviews.length,
        inserted: insertedCount,
        updated: updatedCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error importing reviews:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: 'Vérifiez les logs pour plus de détails'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
