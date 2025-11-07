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
    
    if (!accountId || !locationId) {
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

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to fetch reviews:', error);
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      if (data.reviews) {
        allReviews.push(...data.reviews);
      }
      nextPageToken = data.nextPageToken || null;
    } while (nextPageToken);

    console.log(`Fetched ${allReviews.length} reviews from Google Business`);

    // Upsert reviews to database
    let insertedCount = 0;
    let updatedCount = 0;

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

      const { error: upsertError } = await supabase
        .from('reviews')
        .upsert(reviewData, {
          onConflict: 'review_id_ext',
        });

      if (upsertError) {
        console.error('Failed to upsert review:', upsertError);
        continue;
      }

      // Check if it was an insert or update (simple heuristic)
      const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('review_id_ext', reviewData.review_id_ext);
      
      if (count === 1) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    }

    console.log(`Import complete: ${insertedCount} inserted, ${updatedCount} updated`);

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
    console.error('Error importing reviews:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
