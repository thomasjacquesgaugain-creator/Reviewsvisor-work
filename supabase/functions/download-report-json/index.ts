import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[download-report-json] Début de la génération du rapport JSON');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Extraire le user_id du JWT
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { establishmentId, placeId } = await req.json();

    if (!establishmentId && !placeId) {
      return new Response(
        JSON.stringify({ error: 'establishmentId ou placeId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer l'établissement
    let establishment: any = null;
    
    if (establishmentId) {
      const { data } = await supabaseClient
        .from('establishments')
        .select('*')
        .eq('id', establishmentId)
        .maybeSingle();
      establishment = data;
    }
    
    if (!establishment && placeId) {
      const { data } = await supabaseClient
        .from('establishments')
        .select('*')
        .eq('place_id', placeId)
        .eq('user_id', userId)
        .maybeSingle();
      establishment = data;
    }

    if (!establishment || establishment.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: 'Établissement non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les insights
    const { data: insights } = await supabaseClient
      .from('review_insights')
      .select('*')
      .eq('place_id', establishment.place_id)
      .eq('user_id', userId)
      .maybeSingle();

    // Récupérer les avis
    const { data: reviews } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('place_id', establishment.place_id)
      .eq('user_id', userId)
      .order('published_at', { ascending: false });

    // Créer le rapport JSON
    const report = {
      metadata: {
        generated_at: new Date().toISOString(),
        establishment_id: establishment.id,
        place_id: establishment.place_id,
      },
      establishment: {
        name: establishment.name,
        address: establishment.formatted_address,
        phone: establishment.phone,
        website: establishment.website,
        rating: establishment.rating,
        total_ratings: establishment.user_ratings_total,
      },
      insights: {
        total_reviews: insights?.total_count || reviews?.length || 0,
        average_rating: insights?.avg_rating || 0,
        positive_ratio: insights?.positive_ratio || 0,
        last_analyzed: insights?.last_analyzed_at,
        top_issues: insights?.top_issues || [],
        top_praises: insights?.top_praises || [],
        themes: insights?.themes || [],
        summary: insights?.summary || null,
      },
      reviews: (reviews || []).map(review => ({
        author: review.author_name,
        rating: review.rating,
        text: review.text,
        published_at: review.published_at,
        language: review.language_code,
        owner_reply: review.owner_reply_text,
        owner_reply_time: review.owner_reply_time,
      })),
    };

    console.log('[download-report-json] Rapport généré avec succès');

    return new Response(
      JSON.stringify(report, null, 2),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="rapport-${establishment.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.json"`,
        },
      }
    );
  } catch (error) {
    console.error('[download-report-json] Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
