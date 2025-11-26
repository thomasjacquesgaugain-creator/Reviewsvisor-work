import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[send-report-email] Début de l\'envoi du rapport par email');
    
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

    const { establishmentId, placeId, to } = await req.json();

    if (!to || !to.includes('@')) {
      return new Response(
        JSON.stringify({ error: 'Adresse email invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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

    const jsonContent = JSON.stringify(report, null, 2);
    const filename = `rapport-${establishment.name.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.json`;

    // Envoyer l'email avec Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const emailResponse = await resend.emails.send({
      from: 'Reviewsvisor <no-reply@reviewsvisor.com>',
      to: [to],
      subject: `Rapport d'analyse - ${establishment.name}`,
      html: `
        <h2>Bonjour,</h2>
        <p>Voici le rapport d'analyse pour <strong>${establishment.name}</strong>.</p>
        <p>Ce rapport contient :</p>
        <ul>
          <li>📊 ${insights?.total_count || reviews?.length || 0} avis analysés</li>
          <li>⭐ Note moyenne : ${insights?.avg_rating?.toFixed(1) || 'N/A'}/5</li>
          <li>📈 ${Math.round((insights?.positive_ratio || 0) * 100)}% d'avis positifs</li>
        </ul>
        <p>Le rapport complet est disponible en pièce jointe au format JSON.</p>
        <br />
        <p>À bientôt,<br />L'équipe Reviewsvisor</p>
      `,
      attachments: [
        {
          filename,
          content: Buffer.from(jsonContent).toString('base64'),
        },
      ],
    });

    console.log('[send-report-email] Email envoyé avec succès:', emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: 'Rapport envoyé par email' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[send-report-email] Erreur:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
