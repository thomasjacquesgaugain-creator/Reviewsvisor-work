import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accountName, locationName, placeId } = await req.json();

    if (!accountName || !locationName || !placeId) {
      return new Response(
        JSON.stringify({ error: 'accountName, locationName et placeId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non authentifié' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur non trouvé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les tokens Google
    const { data: connection, error: connError } = await supabaseClient
      .from('google_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: 'Connexion Google non trouvée' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Créer un log d'import
    const { data: importLog, error: logError } = await supabaseClient
      .from('import_logs')
      .insert({
        user_id: user.id,
        place_id: placeId,
        status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      console.error('❌ Erreur création log:', logError);
    }

    console.log(`⭐ Récupération des avis pour ${locationName}...`);

    let allReviews: any[] = [];
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;

    // Pagination pour récupérer tous les avis
    do {
      const url = new URL(`https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews`);
      url.searchParams.set('pageSize', '100');
      url.searchParams.set('orderBy', 'updateTime desc');
      if (nextPageToken) {
        url.searchParams.set('pageToken', nextPageToken);
      }

      const reviewsResponse = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!reviewsResponse.ok) {
        const error = await reviewsResponse.text();
        console.error('❌ Erreur API Google:', error);
        
        // Mettre à jour le log avec l'erreur
        if (importLog) {
          await supabaseClient
            .from('import_logs')
            .update({
              status: 'error',
              error_message: error,
              ended_at: new Date().toISOString(),
            })
            .eq('id', importLog.id);
        }

        return new Response(
          JSON.stringify({ error: 'Erreur lors de la récupération des avis' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const reviewsData = await reviewsResponse.json();
      const reviews = reviewsData.reviews || [];
      allReviews = allReviews.concat(reviews);
      nextPageToken = reviewsData.nextPageToken;
      pageCount++;

      console.log(`📄 Page ${pageCount}: ${reviews.length} avis récupérés (total: ${allReviews.length})`);

    } while (nextPageToken);

    console.log(`✅ Total: ${allReviews.length} avis récupérés`);

    // UPSERT des avis dans la base
    let insertedCount = 0;
    let updatedCount = 0;

    for (const review of allReviews) {
      const reviewData = {
        place_id: placeId,
        review_id_ext: review.reviewId || review.name,
        author_name: review.reviewer?.displayName || 'Anonyme',
        rating: review.starRating === 'STAR_RATING_UNSPECIFIED' ? null : 
                review.starRating === 'ONE' ? 1 :
                review.starRating === 'TWO' ? 2 :
                review.starRating === 'THREE' ? 3 :
                review.starRating === 'FOUR' ? 4 :
                review.starRating === 'FIVE' ? 5 : null,
        comment: review.comment || '',
        create_time: review.createTime,
        update_time: review.updateTime,
        language_code: review.comment ? 'fr' : null,
        reviewer_profile_url: review.reviewer?.profilePhotoUrl,
        owner_reply_text: review.reviewReply?.comment,
        owner_reply_time: review.reviewReply?.updateTime,
        source: 'google',
        published_at: review.createTime,
        text: review.comment || '',
      };

      // Vérifier si l'avis existe déjà
      const { data: existing } = await supabaseClient
        .from('reviews')
        .select('id')
        .eq('review_id_ext', reviewData.review_id_ext)
        .single();

      if (existing) {
        // Update
        await supabaseClient
          .from('reviews')
          .update(reviewData)
          .eq('review_id_ext', reviewData.review_id_ext);
        updatedCount++;
      } else {
        // Insert
        await supabaseClient
          .from('reviews')
          .insert(reviewData);
        insertedCount++;
      }
    }

    console.log(`✅ Import terminé: ${insertedCount} nouveaux, ${updatedCount} mis à jour`);

    // Mettre à jour le log
    if (importLog) {
      await supabaseClient
        .from('import_logs')
        .update({
          status: 'success',
          inserted_count: insertedCount,
          updated_count: updatedCount,
          ended_at: new Date().toISOString(),
        })
        .eq('id', importLog.id);
    }

    // Dispatch event pour rafraîchir l'UI
    return new Response(
      JSON.stringify({ 
        success: true,
        total: allReviews.length,
        inserted: insertedCount,
        updated: updatedCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});