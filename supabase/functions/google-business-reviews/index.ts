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
    const { accountId, locationId, placeId } = await req.json();
    
    console.log('📥 Import request received:', {
      accountId,
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

    // Get access token
    const { data: connection, error: connError } = await supabase
      .from('google_connections')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (connError || !connection) {
      console.error('❌ Google connection not found for user:', user.id, connError);
      throw new Error('Google connection not found');
    }

    console.log('✅ Access token retrieved');

    // Fetch reviews with pagination
    const allReviews: any[] = [];
    let nextPageToken: string | null = null;

    do {
      const url = new URL(`https://mybusiness.googleapis.com/v4/${accountId}/${locationId}/reviews`);
      url.searchParams.set('orderBy', 'update_time');
      url.searchParams.set('pageSize', '100');
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken);
      }

      console.log('🔍 Fetching reviews from:', url.pathname);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Google API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to fetch reviews: ${response.status} ${response.statusText}`);
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
      const reviewData = {
        user_id: user.id,
        place_id: placeId || `gb:${locationId}`,
        source: 'google_business',
        source_review_id: review.reviewId || review.name,
        review_id_ext: review.reviewId || review.name,
        author_name: review.reviewer?.displayName,
        rating: review.starRating === 'FIVE' ? 5 :
                review.starRating === 'FOUR' ? 4 :
                review.starRating === 'THREE' ? 3 :
                review.starRating === 'TWO' ? 2 :
                review.starRating === 'ONE' ? 1 : null,
        text: review.comment,
        create_time: review.createTime,
        update_time: review.updateTime,
        owner_reply_text: review.reviewReply?.comment,
        owner_reply_time: review.reviewReply?.updateTime,
        raw: review,
      };

      // Check if review already exists
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('review_id_ext', reviewData.review_id_ext)
        .single();

      const { error: upsertError } = await supabase
        .from('reviews')
        .upsert(reviewData, {
          onConflict: 'review_id_ext',
        });

      if (upsertError) {
        console.error('❌ Failed to upsert review:', upsertError);
        continue;
      }

      if (existing) {
        updatedCount++;
      } else {
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
        error: error.message,
        details: 'Vérifiez les logs pour plus de détails'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
