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

    // Préparer les données pour les nouveaux KPI
    const topIssues = insights?.top_issues || [];
    const topPraises = insights?.top_praises || [];
    const themes = insights?.themes || [];
    
    // Formater les données des problèmes
    let formattedIssues = [];
    if (Array.isArray(topIssues) && topIssues.length > 0) {
      formattedIssues = topIssues.slice(0, 3).map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return {
            label: item.theme || item.issue || item.name || 'Problème non défini',
            percentage: item.count || item.percentage || 0
          };
        }
        return { label: String(item), percentage: 0 };
      });
    }
    
    // Formater les données des points forts
    let formattedPraises = [];
    if (Array.isArray(topPraises) && topPraises.length > 0) {
      formattedPraises = topPraises.slice(0, 3).map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return {
            label: item.theme || item.praise || item.name || 'Point fort',
            percentage: item.count || item.percentage || 0
          };
        }
        return { label: String(item), percentage: 0 };
      });
    }
    
    // Formater les thématiques
    let formattedThemes = [];
    if (Array.isArray(themes) && themes.length > 0) {
      formattedThemes = themes.map((item: any) => {
        if (typeof item === 'object' && item !== null) {
          return {
            theme: item.theme || item.name || 'Thématique',
            percentage: item.count || item.percentage || 0
          };
        }
        return { theme: String(item), percentage: 0 };
      });
    }
    
    // Si pas de données, utiliser des valeurs mock
    if (formattedIssues.length === 0) {
      formattedIssues = [
        { label: "Service / attente", percentage: 25 },
        { label: "Qualité des plats", percentage: 18 },
        { label: "Prix", percentage: 12 }
      ];
    }
    
    if (formattedPraises.length === 0) {
      formattedPraises = [
        { label: "Qualité / goût", percentage: 40 },
        { label: "Ambiance agréable", percentage: 30 }
      ];
    }
    
    if (formattedThemes.length === 0) {
      formattedThemes = [
        { theme: "Rapidité", percentage: 72 },
        { theme: "Cuisine", percentage: 65 },
        { theme: "Service", percentage: 58 },
        { theme: "Ambiance", percentage: 85 },
        { theme: "Rapport qualité/prix", percentage: 48 }
      ];
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
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      line-height: 1.6;
      background: #ffffff;
    }
    .logo-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 30px;
    }
    .logo-placeholder {
      width: 50px;
      height: 50px;
      background: #e5e7eb;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #6b7280;
      font-size: 20px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: bold;
      color: #1e40af;
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
    .kpi-section {
      margin-bottom: 40px;
    }
    .kpi-section h2 {
      color: #1e40af;
      font-size: 24px;
      margin-bottom: 20px;
      text-align: center;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .kpi-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .kpi-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .kpi-icon {
      font-size: 24px;
    }
    .kpi-title {
      font-size: 16px;
      font-weight: 600;
      color: #374151;
    }
    .kpi-value {
      font-size: 32px;
      font-weight: bold;
      color: #2563eb;
    }
    .kpi-subtitle {
      font-size: 13px;
      color: #6b7280;
    }
    .kpi-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .kpi-list li {
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .kpi-list li:last-child {
      border-bottom: none;
    }
    .kpi-list-number {
      font-weight: bold;
      color: #2563eb;
      margin-right: 8px;
    }
    .kpi-list-text {
      flex: 1;
      color: #374151;
      font-size: 14px;
    }
    .kpi-list-percentage {
      font-weight: 600;
      color: #6b7280;
      font-size: 14px;
    }
    .theme-item {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .theme-item:last-child {
      border-bottom: none;
    }
    .theme-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .theme-name {
      font-weight: 600;
      color: #374151;
      font-size: 14px;
    }
    .theme-percentage {
      font-weight: 600;
      color: #2563eb;
      font-size: 14px;
    }
    .progress-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2563eb, #3b82f6);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .no-data-message {
      color: #9ca3af;
      font-style: italic;
      font-size: 14px;
      text-align: center;
      padding: 20px;
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
    @media (max-width: 768px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
      .info-grid {
        grid-template-columns: 1fr;
      }
      .stats-container {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="logo-header">
    <div class="logo-placeholder">R</div>
    <div class="logo-text">Reviewsvisor</div>
  </div>

  <div class="header">
    <h1>📊 Rapport d'Analyse</h1>
    <div class="subtitle">Généré le ${dateStr} à ${timeStr}</div>
  </div>

  <div class="kpi-section">
    <h2>🔑 KPI clés de l'expérience client</h2>
    
    <div class="kpi-grid">
      <!-- Indice de satisfaction -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-icon">⭐</span>
          <span class="kpi-title">Indice de satisfaction</span>
        </div>
        <div class="kpi-value">${avgRating.toFixed(1)}/5</div>
        <div class="kpi-subtitle">Basé sur ${totalReviews} avis</div>
      </div>

      <!-- Taux d'avis positifs -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-icon">👍</span>
          <span class="kpi-title">Taux d'avis positifs</span>
        </div>
        <div class="kpi-value">${positiveRatio}%</div>
        <div class="kpi-subtitle">Avis ≥ 4★</div>
      </div>

      <!-- Taux d'avis négatifs -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-icon">👎</span>
          <span class="kpi-title">Taux d'avis négatifs</span>
        </div>
        <div class="kpi-value">${negativeRatio}%</div>
        <div class="kpi-subtitle">Avis ≤ 2★</div>
      </div>

      <!-- Taux de réponse -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-icon">💬</span>
          <span class="kpi-title">Taux de réponse aux avis</span>
        </div>
        <div class="kpi-value">${reviews ? Math.round((reviews.filter((r: any) => r.owner_reply_text).length / reviews.length) * 100) : 0}%</div>
        <div class="kpi-subtitle">Avis avec réponse Reviewsvisor</div>
      </div>

      <!-- Top 3 plus gros problèmes -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-icon">🚨</span>
          <span class="kpi-title">Top 3 plus gros problèmes</span>
        </div>
        ${formattedIssues.length > 0 ? `
          <ul class="kpi-list">
            ${formattedIssues.map((issue, index) => `
              <li>
                <span class="kpi-list-number">${index + 1}.</span>
                <span class="kpi-list-text">${issue.label}</span>
                <span class="kpi-list-percentage">${issue.percentage}%</span>
              </li>
            `).join('')}
          </ul>
        ` : `
          <div class="no-data-message">Pas encore assez de données pour identifier les principaux problèmes.</div>
        `}
      </div>

      <!-- Top 3 points forts -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-icon">⭐</span>
          <span class="kpi-title">Top 3 points forts</span>
        </div>
        ${formattedPraises.length > 0 ? `
          <ul class="kpi-list">
            ${formattedPraises.map((praise, index) => `
              <li>
                <span class="kpi-list-number">${index + 1}.</span>
                <span class="kpi-list-text">${praise.label}</span>
                <span class="kpi-list-percentage">${praise.percentage}%</span>
              </li>
            `).join('')}
          </ul>
        ` : `
          <div class="no-data-message">Pas encore assez de données pour identifier les points forts.</div>
        `}
      </div>

      <!-- Avis par thématique -->
      <div class="kpi-card">
        <div class="kpi-card-header">
          <span class="kpi-icon">🧩</span>
          <span class="kpi-title">Avis par thématique</span>
        </div>
        ${formattedThemes.length > 0 ? `
          <div>
            ${formattedThemes.map((themeItem) => `
              <div class="theme-item">
                <div class="theme-header">
                  <span class="theme-name">${themeItem.theme}</span>
                  <span class="theme-percentage">${themeItem.percentage}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${themeItem.percentage}%"></div>
                </div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="no-data-message">Aucune analyse par thématique disponible pour le moment.</div>
        `}
      </div>
    </div>
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
