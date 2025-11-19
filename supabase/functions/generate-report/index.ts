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
    console.log('[generate-report] Starting request processing');
    
    // Récupérer le token JWT depuis le header
    const authHeader = req.headers.get('Authorization');
    console.log('[generate-report] Auth header présent:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[generate-report] Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: 'Veuillez vous reconnecter pour télécharger le rapport' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Créer un client Supabase avec le token utilisateur
    // Les RLS policies vont automatiquement filtrer par user_id
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${token}` },
        },
      }
    );

    // Extraire le user_id du JWT sans faire d'appel à auth.getUser()
    // qui ne fonctionne pas bien dans les edge functions
    let userId: string;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.sub;
      console.log('[generate-report] User ID extrait du JWT:', userId);
    } catch (e) {
      console.error('[generate-report] Erreur lors du parsing du JWT:', e);
      return new Response(
        JSON.stringify({ error: 'Token invalide. Veuillez vous reconnecter.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { placeId } = await req.json();
    console.log('[generate-report] PlaceId reçu:', placeId);

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: 'placeId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-report] Récupération de l\'établissement pour user:', userId, 'place:', placeId);

    // Récupérer l'établissement depuis user_establishment (table utilisée par le reste de l'app)
    const { data: establishment, error: estabError } = await supabaseClient
      .from('user_establishment')
      .select('*')
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .maybeSingle();

    console.log('[generate-report] Établissement trouvé:', !!establishment, 'Erreur:', estabError);

    if (estabError || !establishment) {
      console.log('[generate-report] Aucun établissement trouvé - retour propre sans erreur');
      return new Response(
        JSON.stringify({ ok: false, reason: 'no_establishment' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-report] Récupération des insights et avis');

    // Récupérer les insights
    const { data: insights } = await supabaseClient
      .from('review_insights')
      .select('*')
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .maybeSingle();

    // Récupérer les avis
    const { data: reviews } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('place_id', placeId)
      .eq('user_id', userId)
      .order('published_at', { ascending: false })
      .limit(50);

    console.log('[generate-report] Insights:', !!insights, 'Reviews count:', reviews?.length || 0);

    if (!insights && (!reviews || reviews.length === 0)) {
      console.log('[generate-report] Aucune donnée disponible - retour propre sans erreur');
      return new Response(
        JSON.stringify({ ok: false, reason: 'no_data' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-report] Génération du HTML du rapport');
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const timeStr = now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const totalReviews = insights?.total_count || reviews?.length || 0;
    const avgRating = insights?.avg_rating || 0;
    const positiveRatio = insights?.positive_ratio ? Math.round(insights.positive_ratio * 100) : 0;
    const negativeRatio = 100 - positiveRatio;

    // Analyse du sentiment global
    let sentimentAnalysis = "Aucune analyse disponible";
    if (insights?.summary && typeof insights.summary === 'object') {
      const summary = insights.summary as any;
      if (summary.global_sentiment) {
        sentimentAnalysis = summary.global_sentiment;
      } else if (summary.overview) {
        sentimentAnalysis = summary.overview;
      }
    }

    // Générer le HTML
    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport d'analyse - ${establishment.name}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      line-height: 1.6;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    .header h1 {
      color: #1e40af;
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header .subtitle {
      color: #6b7280;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #2563eb;
    }
    .section h2 {
      color: #1e40af;
      font-size: 20px;
      margin-top: 0;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 15px;
    }
    .info-item {
      background: white;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .info-label {
      font-weight: 600;
      color: #4b5563;
      font-size: 12px;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .info-value {
      color: #111827;
      font-size: 16px;
    }
    .stats-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e5e7eb;
    }
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }
    .stat-label {
      font-size: 14px;
      color: #6b7280;
    }
    .sentiment-box {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      margin: 15px 0;
    }
    .review-item {
      background: white;
      padding: 15px;
      margin-bottom: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .review-author {
      font-weight: 600;
      color: #111827;
    }
    .review-rating {
      color: #f59e0b;
      font-weight: bold;
    }
    .review-date {
      color: #6b7280;
      font-size: 13px;
    }
    .review-text {
      color: #374151;
      font-size: 14px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📊 Rapport d'Analyse</h1>
    <div class="subtitle">Généré le ${dateStr} à ${timeStr}</div>
  </div>

  <div class="section">
    <h2>🏢 Informations de l'établissement</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="info-label">Nom</div>
        <div class="info-value">${establishment.name}</div>
      </div>
      <div class="info-item">
        <div class="info-label">Adresse</div>
        <div class="info-value">${establishment.formatted_address || 'Non renseignée'}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>📈 Statistiques globales</h2>
    <div class="stats-container">
      <div class="stat-box">
        <div class="stat-value">${totalReviews}</div>
        <div class="stat-label">Avis analysés</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${avgRating.toFixed(1)}</div>
        <div class="stat-label">Note moyenne</div>
      </div>
      <div class="stat-box">
        <div class="stat-value">${positiveRatio}%</div>
        <div class="stat-label">Avis positifs</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>💭 Analyse du sentiment global</h2>
    <div class="sentiment-box">
      ${sentimentAnalysis}
    </div>
  </div>

  ${reviews && reviews.length > 0 ? `
  <div class="section">
    <h2>📝 Liste des avis (${Math.min(reviews.length, 50)} derniers)</h2>
    ${reviews.slice(0, 50).map((review: any) => {
      const reviewDate = review.published_at 
        ? new Date(review.published_at).toLocaleDateString('fr-FR')
        : 'Date inconnue';
      const author = review.author || review.author_name || 'Anonyme';
      const rating = review.rating || 0;
      const text = review.text || 'Pas de commentaire';
      const stars = '⭐'.repeat(Math.floor(rating));
      
      return `
        <div class="review-item">
          <div class="review-header">
            <span class="review-author">${author}</span>
            <span class="review-rating">${stars} ${rating}/5</span>
          </div>
          <div class="review-date">${reviewDate}</div>
          <div class="review-text">${text.substring(0, 250)}${text.length > 250 ? '...' : ''}</div>
        </div>
      `;
    }).join('')}
  </div>
  ` : ''}

  <div class="footer">
    Rapport généré automatiquement par Reviewsvisor
  </div>
</body>
</html>
    `;

    console.log('[generate-report] HTML généré avec succès');

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="rapport-${establishment.name.replace(/[^a-z0-9]/gi, '_')}-${now.toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error) {
    console.error('[generate-report] Erreur globale:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors de la génération du rapport', 
        details: error instanceof Error ? error.message : 'Erreur inconnue' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
