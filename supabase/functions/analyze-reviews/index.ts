import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type ReviewRow = {
  place_id: string;
  user_id: string;
  source: string;
  remote_id: string;
  text: string | null;
  rating: number | null;
  published_at: string;
  author_name: string | null;
  author_url: string | null;
  author_photo_url: string | null;
  like_count: number | null;
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' }
  });
}

function env(key: string, fallback = "") {
  return Deno.env.get(key) || fallback;
}

const supabaseAdmin = createClient(
  env("SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } }
);

const anthropicKey = env("ANTHROPIC_API_KEY");

// Fetch reviews from Supabase database instead of Google API
async function fetchReviewsFromDatabase(placeId: string, userId: string): Promise<ReviewRow[]> {
  console.log(`Fetching reviews from database for place_id: ${placeId}, user_id: ${userId}`);
  
  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('place_id', placeId)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching reviews from database:', error);
    throw new Error(`database_fetch_failed: ${error.message}`);
  }
  
  console.log(`Found ${reviews?.length || 0} reviews in database`);
  
  return (reviews || []).map(review => ({
    place_id: placeId,
    user_id: userId,
    source: review.source,
    remote_id: review.source_review_id,
    text: review.text,
    rating: review.rating,
    published_at: review.published_at,
    author_name: review.author,
    author_url: null,
    author_photo_url: null,
    like_count: null,
  }));
}

// Statistics computation
function computeStats(rows: ReviewRow[]) {
  const validRatings = rows.filter(r => r.rating != null).map(r => r.rating!);
  const total = rows.length;
  const overall = validRatings.length ? validRatings.reduce((a, b) => a + b, 0) / validRatings.length : 0;
  
  const positive = validRatings.filter(r => r >= 4).length;
  const negative = validRatings.filter(r => r <= 2).length;
  
  const by_rating = {
    "1": validRatings.filter(r => r === 1).length,
    "2": validRatings.filter(r => r === 2).length,
    "3": validRatings.filter(r => r === 3).length,
    "4": validRatings.filter(r => r === 4).length,
    "5": validRatings.filter(r => r === 5).length,
  };

  return {
    total,
    overall,
    positive_pct: total ? (positive / total) * 100 : 0,
    negative_pct: total ? (negative / total) * 100 : 0,
    by_rating
  };
}

// Heuristic summarizer used as a fallback when AI is unavailable
function buildHeuristicSummary(samples: string[]) {
  const texts = samples.filter(Boolean).map(t => t.toLowerCase());
  const count = (words: string[]) =>
    texts.reduce((acc, t) => acc + words.reduce((s, w) => s + (t.includes(w) ? 1 : 0), 0), 0);

  const issues = [
    { issue: "Service / attente", mentions: count(['attente','long','lent','retard','serveur','serveuse']) },
    { issue: "Qualité des plats", mentions: count(['froid','mal cuit','sec','gras','fade','qualité','cuisson','produit']) },
    { issue: "Prix / addition", mentions: count(['cher','prix','addition','facture','coût']) },
    { issue: "Ambiance / bruit", mentions: count(['bruit','bruyant','musique','ambiance']) },
    { issue: "Propreté / hygiène", mentions: count(['sale','propreté','hygiène']) },
  ].filter(i => i.mentions > 0)
   .sort((a,b) => b.mentions - a.mentions)
   .slice(0,5);

  const strengths = [
    { strength: "Accueil / sympathie", mentions: count(['accueil','sympa','gentil','aimable','souriant']) },
    { strength: "Qualité / goût", mentions: count(['délicieux','excellent','très bon','parfait','succulent','goût']) },
    { strength: "Rapidité du service", mentions: count(['rapide','efficace']) },
    { strength: "Ambiance agréable", mentions: count(['agréable','convivial','chaleureux']) },
    { strength: "Bon rapport qualité/prix", mentions: count(['bon rapport qualité prix','abordable','pas cher']) },
  ].filter(s => s.mentions > 0)
   .sort((a,b) => b.mentions - a.mentions)
   .slice(0,5);

  const recs: string[] = [];
  if (issues.find(i => i.issue.includes('Service'))) recs.push("Réduisez l'attente et améliorez la coordination en salle");
  if (issues.find(i => i.issue.includes('Qualité'))) recs.push("Renforcez le contrôle qualité des plats et la régularité des cuissons");
  if (issues.find(i => i.issue.includes('Prix'))) recs.push("Clarifiez les prix et proposez un menu midi compétitif");
  if (issues.find(i => i.issue.includes('Ambiance'))) recs.push("Ajustez le volume de la musique et l’acoustique pour réduire le bruit");
  if (issues.find(i => i.issue.includes('Propreté'))) recs.push("Planifiez des passages de nettoyage plus fréquents pendant le service");
  if (recs.length === 0) recs.push("Poursuivez vos points forts et collectez plus d’avis textuels pour une analyse plus fine");

  return {
    top_issues: issues.length ? issues : [{ issue: "Aucun problème récurrent identifié", mentions: 1 }],
    top_strengths: strengths.length ? strengths : [{ strength: "Satisfaction générale correcte", mentions: 1 }],
    recommendations: recs.slice(0,3)
  };
}

// Claude (Anthropic) summarization - more reliable than OpenAI
async function summarizeWithClaude(placeName: string, samples: string[]) {
  if (!anthropicKey) {
    console.warn("Anthropic API key not found, returning helpful fallback");
    return {
      top_issues: [
        { issue: "Configuration Anthropic requise", mentions: 1 }
      ],
      top_strengths: [
        { strength: "Clé API manquante", mentions: 1 }
      ],
      recommendations: [
        "Configurez votre clé Anthropic dans les secrets Supabase pour activer l'analyse IA"
      ]
    };
  }

  if (!samples.length) {
    return {
      top_issues: [
        { issue: "Données insuffisantes", mentions: 1 }
      ],
      top_strengths: [
        { strength: "Aucun avis textuel trouvé", mentions: 1 }
      ],
      recommendations: ["Collectez plus d'avis avec du contenu textuel pour l'analyse"]
    };
  }

  const prompt = `Analysez ces avis clients pour ${placeName} et identifiez:

1. Les 5 principales critiques/problèmes mentionnés
2. Les 5 principales forces/points positifs  
3. 3 recommandations d'amélioration

Répondez en JSON avec cette structure exacte:
{
  "top_issues": [{"issue": "description", "mentions": nombre}],
  "top_strengths": [{"strength": "description", "mentions": nombre}],
  "recommendations": ["recommandation 1", "recommandation 2", "recommandation 3"]
}

Avis à analyser:
${samples.slice(0, 50).join('\n---\n')}`;

  try {
    console.log("Calling Claude API for analysis");
    
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${anthropicKey}`,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status} - ${await response.text()}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text;
    
    if (!content) {
      throw new Error("Empty response from Claude");
    }

    console.log("Claude analysis completed successfully");
    return JSON.parse(content);
    
  } catch (error) {
    console.error("Error calling Claude:", error);
    
    // Provide fallback analysis
    return {
      top_issues: [
        { issue: "Erreur d'analyse IA", mentions: 1 }
      ],
      top_strengths: [
        { strength: "Analyse non disponible", mentions: 1 }
      ],
      recommendations: [
        "Vérifiez votre clé API Anthropic",
        "Réessayez dans quelques minutes"
      ]
    };
  }
}

// Main handler
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: cors });
  }

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    const body = await req.json();
    const { place_id, name, dryRun = false } = body;

    if (!place_id) {
      return json({ error: "place_id required" }, 400);
    }

    // Extract user ID from auth header
    const authHeader = req.headers.get("authorization");
    let userId = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        userId = user?.id;
      } catch (error) {
        console.error("Auth error:", error);
      }
    }

    if (!userId) {
      return json({ error: "Authentication required" }, 401);
    }

    console.log(`Starting analysis for place_id: ${place_id}, user_id: ${userId}, dryRun: ${dryRun}`);

    // 1) Fetch existing reviews from database
    const rows = await fetchReviewsFromDatabase(place_id, userId);
    
    if (!rows || rows.length === 0) {
      return json({
        ok: false,
        error: "no_reviews_found",
        message: "Aucun avis trouvé dans la base de données pour cet établissement. Veuillez d'abord importer des avis."
      });
    }
    
    console.log(`Analyzing ${rows.length} existing reviews from database`);

    // 2) Compute stats from existing reviews
    const stats = computeStats(rows);
    const sampleTexts = rows.map(r => r.text ?? "").filter(Boolean).slice(0, 120);
    let summary = await summarizeWithClaude(name ?? "Cet établissement", sampleTexts);
    if (!summary?.top_issues?.length || (summary.top_issues[0]?.issue || "").toLowerCase().includes("erreur d'analyse ia")) {
      summary = buildHeuristicSummary(sampleTexts);
    }

    // 3) Store insights in database (if not dry run)
    if (!dryRun) {
      const { error } = await supabaseAdmin.from("review_insights").upsert({
        place_id,
        user_id: userId,
        last_analyzed_at: new Date().toISOString(),
        total_count: stats.total,
        avg_rating: stats.overall,
        positive_ratio: stats.positive_pct / 100,
        top_issues: summary.top_issues,
        top_praises: summary.top_strengths,
        summary: {
          recommendations: summary.recommendations,
          analysis_date: new Date().toISOString(),
          source: "existing_reviews"
        }
      });
      if (error) {
        console.error("Error saving insights:", error);
        throw new Error(`insights_upsert_failed: ${error.message}`);
      }
    }

    return json({
      ok: true,
      message: `Analyse terminée sur ${rows.length} avis existants`,
      counts: { analyzed: rows.length, total: stats.total },
      analysis: {
        total_reviews: stats.total,
        avg_rating: stats.overall,
        positive_ratio: stats.positive_pct,
        top_issues: summary.top_issues,
        top_strengths: summary.top_strengths
      },
      dryRun
    });
  } catch (e) {
    console.error("Analysis error:", e);
    return json({ ok: false, error: String(e?.message ?? e) }, 500);
  }
});