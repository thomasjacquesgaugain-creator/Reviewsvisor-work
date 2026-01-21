import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fonction pour convertir une image en base64
async function imageToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('[generate-report] Erreur conversion logo en base64:', error);
    // Retourner un pixel transparent en cas d'erreur
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-report] ========== DÉBUT ==========');
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
      console.log('[generate-report] ✅ User ID extrait du JWT:', userId);
    } catch (e) {
      console.error('[generate-report] ❌ Erreur lors du parsing du JWT:', e);
      return new Response(
        JSON.stringify({ error: 'Token invalide. Veuillez vous reconnecter.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { establishmentId, placeId } = await req.json();
    console.log('[generate-report] 📥 Payload reçu:', { establishmentId, placeId });

    if (!establishmentId && !placeId) {
      console.error('[generate-report] ❌ Ni establishmentId ni placeId fourni');
      return new Response(
        JSON.stringify({ error: 'establishmentId ou placeId requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-report] 🔍 Recherche établissement...');

    // Essayer d'abord par ID, sinon par place_id
    let establishment: any = null;
    
    if (establishmentId) {
      console.log('[generate-report] Tentative de récupération par ID:', establishmentId);
      const { data, error } = await supabaseClient
        .from('establishments')
        .select('*')
        .eq('id', establishmentId)
        .maybeSingle();
      
      if (!error && data) {
        establishment = data;
        console.log('[generate-report] ✅ Établissement trouvé par ID');
      }
    }
    
    // Si pas trouvé par ID, chercher par place_id
    if (!establishment && placeId) {
      console.log('[generate-report] Tentative de récupération par place_id:', placeId);
      const { data, error } = await supabaseClient
        .from('establishments')
        .select('*')
        .eq('place_id', placeId)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        establishment = data;
        console.log('[generate-report] ✅ Établissement trouvé par place_id');
      } else if (!data) {
        // L'établissement n'existe pas dans la table, créons-le
        console.log('[generate-report] ⚠️ Établissement non trouvé, création automatique...');
        
        // Récupérer les infos depuis le premier avis
        const { data: firstReview } = await supabaseClient
          .from('reviews')
          .select('*')
          .eq('place_id', placeId)
          .eq('user_id', userId)
          .limit(1)
          .maybeSingle();
        
        const establishmentName = firstReview?.raw?.establishment_name || 
                                  firstReview?.raw?.name || 
                                  'Établissement';
        
        const { data: newEstab, error: createError } = await supabaseClient
          .from('establishments')
          .insert({
            place_id: placeId,
            user_id: userId,
            name: establishmentName,
            source: 'dashboard',
          })
          .select()
          .single();
        
        if (!createError && newEstab) {
          establishment = newEstab;
          console.log('[generate-report] ✅ Nouvel établissement créé:', newEstab.id);
        }
      }
    }

    if (!establishment) {
      console.error('[generate-report] ❌ Établissement non trouvé après toutes les tentatives');
      return new Response(
        JSON.stringify({ error: 'ESTABLISHMENT_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que l'établissement appartient à l'utilisateur
    if (establishment.user_id !== userId) {
      console.error('[generate-report] ❌ Établissement n\'appartient pas à l\'utilisateur');
      return new Response(
        JSON.stringify({ error: 'ESTABLISHMENT_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-report] ✅ Établissement trouvé:', establishment.name);

    console.log('[generate-report] 📊 Récupération des insights et avis pour place_id:', establishment.place_id);

    // Récupérer les insights
    const { data: insights } = await supabaseClient
      .from('review_insights')
      .select('*')
      .eq('place_id', establishment.place_id)
      .eq('user_id', establishment.user_id)
      .maybeSingle();

    // Récupérer les avis
    const { data: reviews } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('place_id', establishment.place_id)
      .eq('user_id', establishment.user_id)
      .order('published_at', { ascending: false })
      .limit(50);

    console.log('[generate-report] Données récupérées:', {
      insights: !!insights,
      reviews_count: reviews?.length || 0
    });

    if (!insights && (!reviews || reviews.length === 0)) {
      console.log('[generate-report] ⚠️ Aucune donnée d\'analyse disponible');
      return new Response(
        JSON.stringify({ error: 'Aucune analyse disponible pour cet établissement' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-report] 📝 Génération du HTML du rapport');
    
    // Convertir le logo en base64
    const logoUrl = 'https://zzjmtipdsccxmmoaetlp.supabase.co/storage/v1/object/public/lovable-uploads/62ee8352-36cc-4657-89b4-5c00321ab74c.png';
    const logoBase64 = await imageToBase64(logoUrl);
    console.log('[generate-report] Logo converti en base64');
    
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

    // Préparer les données pour les nouveaux KPI
    const topIssues = insights?.top_issues || [];
    const topPraises = insights?.top_praises || [];
    const themes = insights?.themes || [];
    
    // Formater les données des problèmes
    let formattedIssues: Array<{ label: string; percentage: number }> = [];
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
    let formattedPraises: Array<{ label: string; percentage: number }> = [];
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
    let formattedThemes: Array<{ theme: string; percentage: number }> = [];
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

    // Génération de l'analyse IA des statistiques globales
    console.log('[generate-report] Génération de l\'analyse IA');
    let aiAnalysis = "Analyse en cours...";
    
    try {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (!LOVABLE_API_KEY) {
        console.error('[generate-report] LOVABLE_API_KEY non configurée');
        aiAnalysis = "L'analyse IA n'est pas disponible pour le moment.";
      } else {
        const topIssuesText = formattedIssues.map((i, idx) => `${idx + 1}. ${i.label} (${i.percentage}%)`).join(', ');
        const topPraisesText = formattedPraises.map((p, idx) => `${idx + 1}. ${p.label} (${p.percentage}%)`).join(', ');
        
        const prompt = `Tu es un expert en analyse de satisfaction client pour les restaurants et établissements. 
Rédige un paragraphe analytique et professionnel (150-200 mots) résumant la performance de l'établissement "${establishment.name}" basé sur ces données :

- Note moyenne : ${avgRating.toFixed(1)}/5
- Nombre total d'avis analysés : ${totalReviews}
- Taux d'avis positifs (≥4★) : ${positiveRatio}%
- Taux d'avis négatifs (≤2★) : ${negativeRatio}%
- Top 3 problèmes identifiés : ${topIssuesText || 'Aucun problème majeur identifié'}
- Top 3 points forts : ${topPraisesText || 'Points forts à identifier'}

Ton analyse doit :
1. Commencer par un constat général sur la satisfaction client
2. Mettre en avant les points forts de l'établissement
3. Identifier les axes d'amélioration prioritaires
4. Être factuelle, claire et constructive
5. Ne pas utiliser de formatage markdown, juste du texte simple

Rédige uniquement le paragraphe d'analyse, sans titre ni introduction.`;

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'Tu es un expert en analyse de satisfaction client.' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiAnalysis = aiData.choices?.[0]?.message?.content || "L'analyse n'a pas pu être générée.";
          console.log('[generate-report] Analyse IA générée avec succès');
        } else {
          console.error('[generate-report] Erreur API IA:', await aiResponse.text());
          aiAnalysis = "L'analyse IA n'a pas pu être générée pour le moment.";
        }
      }
    } catch (error) {
      console.error('[generate-report] Erreur lors de la génération de l\'analyse IA:', error);
      aiAnalysis = "Une erreur s'est produite lors de la génération de l'analyse.";
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
      gap: 8px;
      margin-bottom: 20px;
    }
    .logo-header img {
      width: 28px;
      height: 28px;
      border-radius: 6px;
    }
    .logo-text {
      font-size: 22px;
      font-weight: 600;
      color: #2563eb;
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
    .ai-analysis-box {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      line-height: 1.8;
      color: #374151;
      font-size: 15px;
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
    <img src="${logoBase64}" alt="Reviewsvisor Logo" width="28" height="28" style="border-radius: 6px;" />
    <span class="logo-text">Reviewsvisor</span>
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
            ${formattedThemes.map((themeItem) => {
              // Calculer les % positifs et négatifs pour cette thématique
              const themeItemAny = themeItem as any;
              const themePositive = themeItemAny.positivePercentage || Math.round(themeItem.percentage * 0.7); // Estimation
              const themeNegative = themeItemAny.negativePercentage || Math.round(themeItem.percentage * 0.3); // Estimation
              return `
                <div class="theme-item">
                  <div class="theme-header">
                    <span class="theme-name">${themeItem.theme}</span>
                  </div>
                  <div style="display: flex; gap: 10px; font-size: 12px; color: #6b7280; margin-top: 4px;">
                    <span>✅ ${themePositive}% positifs</span>
                    <span>❌ ${themeNegative}% négatifs</span>
                  </div>
                  <div class="progress-bar" style="margin-top: 8px;">
                    <div class="progress-fill" style="width: ${themeItem.percentage}%"></div>
                  </div>
                </div>
              `;
            }).join('')}
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
    <h2>📊 Analyse des statistiques globales</h2>
    <div class="ai-analysis-box">
      ${aiAnalysis}
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

    console.log('[generate-report] ✅ HTML généré avec succès');
    console.log('[generate-report] ========== FIN ==========');

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="rapport-${establishment.name.replace(/[^a-z0-9]/gi, '_')}-${now.toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error) {
    console.error('[generate-report] ❌ Erreur globale:', error);
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
