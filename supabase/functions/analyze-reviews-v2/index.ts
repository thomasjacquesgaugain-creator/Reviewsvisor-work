/**
 * Edge Function: analyze-reviews-v2
 * Version: v2-auto-universal
 * 
 * Pipeline d'analyse en 2 passes :
 * - PASS A: Détection businessType + extraction thèmes universels + thèmes métier (si confidence >= 75)
 * - PASS B: Recommandations + reply templates
 * 
 * Format de sortie JSON strict validé par Zod
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

// Note: Pour Deno, on ne peut pas importer directement depuis src/
// On duplique les types et fonctions nécessaires ici
type BusinessType = 
  | 'restaurant' 
  | 'salon_coiffure' 
  | 'salle_sport' 
  | 'serrurier' 
  | 'retail_chaussures' 
  | 'institut_beaute' 
  | 'autre';

type ReviewRow = {
  user_id: string | null;
  place_id: string;
  source: "google";
  remote_id: string;
  rating: number | null;
  text: string | null;
  language_code: string | null;
  published_at: string | null;
  author_name: string | null;
  author_url: string | null;
  author_photo_url: string | null;
  like_count: number | null;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

function env(key: string, fallback = "") {
  return Deno.env.get(key) ??
         (key === "SUPABASE_URL" ? Deno.env.get("SB_URL") : undefined) ??
         (key === "SUPABASE_SERVICE_ROLE_KEY" ? Deno.env.get("SB_SERVICE_ROLE_KEY") : undefined) ??
         fallback;
}

const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_ROLE = env("SUPABASE_SERVICE_ROLE_KEY");
const GOOGLE_KEY   = env("GOOGLE_PLACES_API_KEY");
const OPENAI_KEY   = env("OPENAI_API_KEY", "");

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// Détection businessType simplifiée (version Deno)
function detectBusinessType(
  name: string,
  googlePlacesTypes?: string[] | null,
  reviewsTexts?: string[]
): { type: BusinessType; confidence: number; candidates: Array<{type: BusinessType; confidence: number}>; source: 'places' | 'keywords' | 'manual' } {
  const combinedText = `${name} ${(reviewsTexts || []).join(' ')}`.toLowerCase();
  
  // Mapping Google Places
  const placesMapping: Record<string, BusinessType> = {
    'restaurant': 'restaurant', 'food': 'restaurant', 'cafe': 'restaurant',
    'hair_care': 'salon_coiffure', 'beauty_salon': 'salon_coiffure',
    'gym': 'salle_sport', 'health': 'salle_sport',
    'locksmith': 'serrurier',
    'shoe_store': 'retail_chaussures',
    'spa': 'institut_beaute'
  };

  // Keywords par type
  const keywords: Record<BusinessType, string[]> = {
    restaurant: ['restaurant', 'resto', 'bistrot', 'brasserie', 'café', 'bar', 'pizzeria', 'burger', 'sushi', 'cuisine', 'manger', 'repas', 'plat'],
    salon_coiffure: ['coiffeur', 'coiffeuse', 'salon', 'barber', 'hair', 'cheveux', 'coloration', 'coupe', 'coiffure'],
    salle_sport: ['gym', 'fitness', 'salle de sport', 'sport', 'musculation', 'crossfit', 'yoga', 'coach'],
    serrurier: ['serrurier', 'serrurerie', 'dépannage', 'clé', 'verrou', 'serrure', 'urgence'],
    retail_chaussures: ['chaussure', 'chaussures', 'sneaker', 'basket', 'magasin', 'boutique'],
    institut_beaute: ['institut', 'beauté', 'beaute', 'esthétique', 'soin', 'massage', 'épilation'],
    autre: []
  };

  // 1. Essayer Google Places
  if (googlePlacesTypes && googlePlacesTypes.length > 0) {
    for (const placeType of googlePlacesTypes) {
      const mapped = placesMapping[placeType];
      if (mapped) {
        return {
          type: mapped,
          confidence: 90,
          candidates: [{ type: mapped, confidence: 90 }],
          source: 'places'
        };
      }
    }
  }

  // 2. Fallback keywords
  const scores: Record<BusinessType, number> = {
    restaurant: 0, salon_coiffure: 0, salle_sport: 0, serrurier: 0,
    retail_chaussures: 0, institut_beaute: 0, autre: 0
  };

  Object.entries(keywords).forEach(([type, words]) => {
    words.forEach(word => {
      if (combinedText.includes(word)) {
        scores[type as BusinessType] += name.toLowerCase().includes(word) ? 3 : 1;
      }
    });
  });

  const sorted = Object.entries(scores)
    .filter(([t]) => t !== 'autre')
    .map(([type, score]) => ({ type: type as BusinessType, score }))
    .sort((a, b) => b.score - a.score);

  if (sorted[0].score === 0) {
    return { type: 'autre', confidence: 0, candidates: [], source: 'keywords' };
  }

  const top = sorted[0];
  const confidence = Math.min(100, Math.round((top.score / 10) * 100));
  const candidates = sorted
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => ({ type: s.type, confidence: Math.min(100, Math.round((s.score / 10) * 100)) }));

  return { type: top.type, confidence, candidates, source: 'keywords' };
}

// Stats simples
function computeStats(rows: ReviewRow[]) {
  const ratings = rows.map(r => r.rating ?? 0).filter(n => n > 0);
  const total = rows.length;
  const avg = ratings.length ? (ratings.reduce((a,b)=>a+b,0) / ratings.length) : null;
  const pos = rows.filter(r => (r.rating ?? 0) >= 4).length;
  const neg = rows.filter(r => (r.rating ?? 0) <= 2).length;
  const positive_pct = total ? Math.round((pos / total) * 100) : 0;
  const negative_pct = total ? Math.round((neg / total) * 100) : 0;
  const by_rating: Record<string, number> = {};
  for (let i=1;i<=5;i++) by_rating[i] = rows.filter(r => (r.rating ?? 0) === i).length;
  return { total, by_rating, positive_pct, negative_pct, overall: avg };
}

// PASS A: Détection + extraction thèmes
async function analyzePassA(
  placeName: string,
  samples: string[],
  totalReviews: number,
  businessType: BusinessType,
  businessTypeConfidence: number
) {
  if (!OPENAI_KEY) {
    return null;
  }

  const universalThemes = ['Accueil', 'Propreté', 'Prix', 'Attente', 'Communication', 'SAV', 'Confiance'];
  const industryThemesHint = businessTypeConfidence >= 75 
    ? `\nThèmes spécifiques au secteur ${businessType} à rechercher également.`
    : '\nFocus uniquement sur les thèmes universels (ne pas inventer de thèmes spécifiques au secteur).';

  const prompt = [
    { role: "system", content: `Tu es un analyste expert qui synthétise des avis clients en français.
Tu dois extraire les thématiques UNIQUEMENT depuis le contenu réel des avis.
Réponds exclusivement en JSON valide.` },
    { role: "user", content:
`Établissement: ${placeName}
Type détecté: ${businessType} (confiance: ${businessTypeConfidence}%)
Total d'avis analysés: ${totalReviews}

Avis clients:
${samples.slice(0, 100).map((t,i)=>`${i+1}. ${t}`).join("\n")}

INSTRUCTIONS:
1. Extrais les thèmes UNIVERSELS mentionnés: ${universalThemes.join(', ')}${industryThemesHint}
2. Pour chaque thème, détermine le sentiment (positive/mixed/negative) et l'importance (0-100)
3. Inclus 1-2 citations courtes comme preuve
4. Si confidence >= 75%, extrais aussi les thèmes spécifiques au secteur ${businessType}
5. Si confidence < 75%, ne liste QUE les thèmes universels

Retourne ce JSON:
{
  "themes_universal": [
    {
      "theme": "Accueil",
      "sentiment": "positive|mixed|negative",
      "importance": 0-100,
      "evidence_quotes": ["citation 1", "citation 2"],
      "what_it_means": "Explication courte"
    }
  ],
  "themes_industry": [
    {
      "theme": "Thème spécifique secteur",
      "sentiment": "positive|mixed|negative",
      "importance": 0-100,
      "evidence_quotes": ["citation"],
      "what_it_means": "Explication"
    }
  ],
  "summary": {
    "one_liner": "Résumé en une phrase",
    "what_customers_love": ["point 1", "point 2"],
    "what_customers_hate": ["point 1", "point 2"]
  }
}`
    }
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: prompt
    })
  });

  const data = await resp.json();
  const txt = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(txt);
  } catch (err) {
    console.error('[analyzePassA] ❌ Erreur parsing:', err);
    return null;
  }
}

// PASS B: Recommandations + reply templates
async function analyzePassB(
  placeName: string,
  businessType: BusinessType,
  businessTypeConfidence: number,
  themesUniversal: any[],
  themesIndustry: any[],
  topIssues: any[],
  avgRating: number | null
) {
  if (!OPENAI_KEY) {
    return null;
  }

  const prompt = [
    { role: "system", content: `Tu es un consultant expert en amélioration de l'expérience client.
Génère des recommandations actionnables et des templates de réponses adaptés au secteur.
Réponds exclusivement en JSON valide.` },
    { role: "user", content:
`Établissement: ${placeName}
Type: ${businessType} (confiance: ${businessTypeConfidence}%)
Note moyenne: ${avgRating?.toFixed(1) || 'N/A'}

Thèmes identifiés (universels): ${themesUniversal.map((t: any) => t.theme).join(', ')}
${themesIndustry.length > 0 ? `Thèmes métier: ${themesIndustry.map((t: any) => t.theme).join(', ')}` : ''}
Problèmes prioritaires: ${topIssues.map((i: any) => i.theme || i).join(', ')}

Génère:
1. Pain points priorisés (impact 0-100, ease 0-100, first_step concret)
2. Quick wins (7 jours) - actions rapides avec résultat attendu
3. Projets (30 jours) - actions plus structurées
4. Reply templates (positive/neutral/negative) adaptés au secteur ${businessType}

Retourne ce JSON:
{
  "pain_points_prioritized": [
    {
      "issue": "Nom du problème",
      "why_it_matters": "Pourquoi c'est important",
      "impact": 0-100,
      "ease": 0-100,
      "first_step": "Première action concrète"
    }
  ],
  "recommendations": {
    "quick_wins_7_days": [
      {
        "title": "Titre action",
        "details": "Détails",
        "expected_result": "Résultat attendu",
        "priority": 1-5
      }
    ],
    "projects_30_days": [
      {
        "title": "Titre projet",
        "details": "Détails",
        "expected_result": "Résultat attendu",
        "priority": 1-5
      }
    ]
  },
  "reply_templates": {
    "positive": [
      {
        "title": "Titre template",
        "reply": "Texte de réponse",
        "use_when": "Quand utiliser"
      }
    ],
    "neutral": [...],
    "negative": [...]
  }
}`
    }
  ];

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "authorization": `Bearer ${OPENAI_KEY}` },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: prompt
    })
  });

  const data = await resp.json();
  const txt = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return JSON.parse(txt);
  } catch (err) {
    console.error('[analyzePassB] ❌ Erreur parsing:', err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const auth = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (auth.toLowerCase().startsWith("bearer ")) {
      try {
        const { data } = await supabaseAdmin.auth.getUser(auth.split(" ")[1]);
        userId = data.user?.id ?? null;
      } catch {}
    }

    if (!userId) {
      return json({ ok: false, error: "authentication_required" }, 401);
    }

    const { place_id, name, dryRun = false } = await req.json().catch(()=>({}));
    if (!place_id) return json({ ok:false, error:"missing_place_id" }, 400);

    // Récupérer l'établissement pour obtenir Google Places types
    let establishmentName = name || 'Établissement';
    let googlePlacesTypes: string[] | null = null;
    
    try {
      const { data: establishment } = await supabaseAdmin
        .from('establishments')
        .select('name, types')
        .eq('place_id', place_id)
        .eq('user_id', userId)
        .maybeSingle();
      
      if (establishment?.name) {
        establishmentName = establishment.name;
      }
      if (establishment?.types && Array.isArray(establishment.types)) {
        googlePlacesTypes = establishment.types as string[];
      }
    } catch (err) {
      console.warn('[analyze-reviews-v2] Erreur récupération établissement:', err);
    }

    // Récupérer les avis
    const { data: reviewsData, error: reviewsErr } = await supabaseAdmin
      .from('reviews')
      .select('text, rating')
      .eq('place_id', place_id)
      .eq('user_id', userId)
      .limit(200);

    if (reviewsErr) throw new Error(`reviews_fetch_failed:${reviewsErr.message}`);
    const rows: ReviewRow[] = (reviewsData || []).map((r: any) => ({
      user_id: userId,
      place_id,
      source: "google" as const,
      remote_id: r.id || crypto.randomUUID(),
      rating: r.rating ?? null,
      text: r.text ?? null,
      language_code: null,
      published_at: null,
      author_name: null,
      author_url: null,
      author_photo_url: null,
      like_count: null,
    }));

    if (rows.length === 0) {
      return json({ ok: false, error: "no_reviews_found" }, 400);
    }

    // Stats
    const stats = computeStats(rows);
    const sampleTexts = rows.map(r => r.text ?? "").filter(Boolean).slice(0, 120);
    const reviewTexts = sampleTexts;

    // Détection businessType
    const detection = detectBusinessType(establishmentName, googlePlacesTypes, reviewTexts);
    console.log(`[analyze-reviews-v2] Détection: ${detection.type} (${detection.confidence}%) via ${detection.source}`);

    // PASS A: Extraction thèmes
    const passAResult = await analyzePassA(
      establishmentName,
      sampleTexts,
      rows.length,
      detection.type,
      detection.confidence
    );

    if (!passAResult) {
      return json({ ok: false, error: "analysis_pass_a_failed" }, 500);
    }

    // Préparer top_issues depuis les thèmes négatifs
    const negativeThemes = [
      ...(passAResult.themes_universal || []).filter((t: any) => t.sentiment === 'negative'),
      ...(passAResult.themes_industry || []).filter((t: any) => t.sentiment === 'negative')
    ].sort((a: any, b: any) => b.importance - a.importance).slice(0, 3);

    // PASS B: Recommandations + templates
    const passBResult = await analyzePassB(
      establishmentName,
      detection.type,
      detection.confidence,
      passAResult.themes_universal || [],
      passAResult.themes_industry || [],
      negativeThemes,
      stats.overall
    );

    if (!passBResult) {
      return json({ ok: false, error: "analysis_pass_b_failed" }, 500);
    }

    // Assembler le résultat final
    const analysisResult = {
      business_type: detection.type,
      business_type_confidence: detection.confidence,
      business_type_candidates: detection.candidates,
      summary: passAResult.summary || {
        one_liner: `Analyse de ${rows.length} avis pour ${establishmentName}`,
        what_customers_love: [],
        what_customers_hate: []
      },
      kpis: {
        avg_rating: stats.overall,
        total_reviews: stats.total,
        positive_ratio_estimate: stats.positive_pct,
        negative_ratio_estimate: stats.negative_pct
      },
      themes_universal: passAResult.themes_universal || [],
      themes_industry: detection.confidence >= 75 ? (passAResult.themes_industry || []) : [],
      pain_points_prioritized: passBResult.pain_points_prioritized || [],
      recommendations: passBResult.recommendations || {
        quick_wins_7_days: [],
        projects_30_days: []
      },
      reply_templates: passBResult.reply_templates || {
        positive: [],
        neutral: [],
        negative: []
      }
    };

    // Sauvegarder dans review_insights (format v2)
    if (!dryRun) {
      const payload = {
        place_id,
        user_id: userId,
        last_analyzed_at: new Date().toISOString(),
        business_type: detection.type,
        business_type_confidence: detection.confidence,
        business_type_candidates: detection.candidates,
        analysis_version: 'v2-auto-universal',
        total_count: stats.total,
        avg_rating: stats.overall,
        positive_ratio: stats.positive_pct / 100,
        // Format v1 (rétrocompatibilité)
        themes: [
          ...(passAResult.themes_universal || []).map((t: any) => ({ theme: t.theme, count: Math.round(t.importance / 10) })),
          ...(passAResult.themes_industry || []).map((t: any) => ({ theme: t.theme, count: Math.round(t.importance / 10) }))
        ],
        top_issues: negativeThemes.map((t: any, idx: number) => ({
          theme: t.theme,
          count: Math.round(t.importance / 10),
          severity: idx < 1 ? 'high' : 'medium'
        })),
        top_praises: [
          ...(passAResult.themes_universal || []).filter((t: any) => t.sentiment === 'positive'),
          ...(passAResult.themes_industry || []).filter((t: any) => t.sentiment === 'positive')
        ].slice(0, 3).map((t: any) => ({
          theme: t.theme,
          count: Math.round(t.importance / 10)
        })),
        summary: {
          total: stats.total,
          by_rating: stats.by_rating,
          positive_pct: stats.positive_pct,
          negative_pct: stats.negative_pct,
          recommendations: (passBResult.recommendations?.quick_wins_7_days || []).slice(0, 3).map((r: any) => r.title)
        },
        // Format v2 (nouveau)
        themes_universal: passAResult.themes_universal || [],
        themes_industry: detection.confidence >= 75 ? (passAResult.themes_industry || []) : [],
        pain_points_prioritized: passBResult.pain_points_prioritized || [],
        recommendations_quick_wins: passBResult.recommendations?.quick_wins_7_days || [],
        recommendations_projects: passBResult.recommendations?.projects_30_days || [],
        reply_templates: passBResult.reply_templates || {},
        summary_one_liner: passAResult.summary?.one_liner || '',
        summary_what_customers_love: passAResult.summary?.what_customers_love || [],
        summary_what_customers_hate: passAResult.summary?.what_customers_hate || []
      };

      const { data: existsRows } = await supabaseAdmin
        .from('review_insights')
        .select('place_id')
        .eq('place_id', place_id)
        .eq('user_id', userId)
        .limit(1);

      if (existsRows && existsRows.length > 0) {
        await supabaseAdmin
          .from('review_insights')
          .update(payload)
          .eq('place_id', place_id)
          .eq('user_id', userId);
      } else {
        await supabaseAdmin
          .from('review_insights')
          .insert(payload);
      }

      // Mettre à jour l'établissement avec le businessType détecté
      await supabaseAdmin
        .from('establishments')
        .update({
          business_type: detection.type,
          business_type_confidence: detection.confidence,
          business_type_candidates: detection.candidates,
          business_type_source: detection.source,
          analysis_version: 'v2-auto-universal'
        })
        .eq('place_id', place_id)
        .eq('user_id', userId);
    }

    return json({
      ok: true,
      analysis: analysisResult,
      counts: { collected: rows.length },
      dryRun
    });
  } catch (e) {
    console.error('[analyze-reviews-v2] Error:', e);
    return json({ ok:false, error: String(e?.message ?? e) }, 500);
  }
});
