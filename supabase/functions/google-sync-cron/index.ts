import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number } | null> {
  const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID');
  const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET');

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('❌ Erreur refresh token:', await response.text());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Erreur refresh:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('🔄 Démarrage synchronisation automatique...');

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Récupérer toutes les connexions Google actives
    const { data: connections, error: connError } = await supabaseAdmin
      .from('google_connections')
      .select('*');

    if (connError) throw connError;

    console.log(`📊 ${connections?.length || 0} connexions Google trouvées`);

    for (const connection of connections || []) {
      console.log(`\n👤 Traitement utilisateur ${connection.user_id}...`);

      // Vérifier expiration du token
      const now = new Date();
      const expiresAt = new Date(connection.token_expires_at);
      let accessToken = connection.access_token;

      if (now >= expiresAt && connection.refresh_token) {
        console.log('🔄 Token expiré, rafraîchissement...');
        const refreshed = await refreshGoogleToken(connection.refresh_token);
        
        if (refreshed) {
          accessToken = refreshed.access_token;
          const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
          
          await supabaseAdmin
            .from('google_connections')
            .update({
              access_token: accessToken,
              token_expires_at: newExpiresAt.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', connection.id);
          
          console.log('✅ Token rafraîchi avec succès');
        } else {
          console.log('❌ Échec refresh token, skip user');
          continue;
        }
      }

      // Récupérer les établissements de l'utilisateur avec google_location_id
      const { data: establishments } = await supabaseAdmin
        .from('establishments')
        .select('*')
        .eq('user_id', connection.user_id)
        .not('google_location_id', 'is', null);

      if (!establishments || establishments.length === 0) {
        console.log('ℹ️ Aucun établissement Google configuré');
        continue;
      }

      for (const establishment of establishments) {
        console.log(`📍 Sync ${establishment.name}...`);

        // Créer log d'import
        const { data: importLog } = await supabaseAdmin
          .from('import_logs')
          .insert({
            user_id: connection.user_id,
            place_id: establishment.place_id,
            status: 'pending',
          })
          .select()
          .single();

        try {
          const accountName = establishment.google_account_id;
          const locationName = establishment.google_location_id;

          // Récupérer les avis mis à jour récemment (dernières 24h)
          const url = new URL(`https://mybusiness.googleapis.com/v4/${accountName}/${locationName}/reviews`);
          url.searchParams.set('pageSize', '100');
          url.searchParams.set('orderBy', 'updateTime desc');

          const reviewsResponse = await fetch(url.toString(), {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!reviewsResponse.ok) {
            throw new Error(await reviewsResponse.text());
          }

          const reviewsData = await reviewsResponse.json();
          const reviews = reviewsData.reviews || [];

          let insertedCount = 0;
          let updatedCount = 0;

          for (const review of reviews) {
            const reviewData = {
              place_id: establishment.place_id,
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

            const { data: existing } = await supabaseAdmin
              .from('reviews')
              .select('id')
              .eq('review_id_ext', reviewData.review_id_ext)
              .single();

            if (existing) {
              await supabaseAdmin.from('reviews').update(reviewData).eq('review_id_ext', reviewData.review_id_ext);
              updatedCount++;
            } else {
              await supabaseAdmin.from('reviews').insert(reviewData);
              insertedCount++;
            }
          }

          console.log(`✅ ${insertedCount} nouveaux, ${updatedCount} mis à jour`);

          if (importLog) {
            await supabaseAdmin.from('import_logs').update({
              status: 'success',
              inserted_count: insertedCount,
              updated_count: updatedCount,
              ended_at: new Date().toISOString(),
            }).eq('id', importLog.id);
          }
        } catch (error) {
          console.error('❌ Erreur sync:', error);
          if (importLog) {
            await supabaseAdmin.from('import_logs').update({
              status: 'error',
              error_message: error.message,
              ended_at: new Date().toISOString(),
            }).eq('id', importLog.id);
          }
        }
      }
    }

    console.log('✅ Synchronisation automatique terminée');

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});