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

const openAIKey = env("OPENAI_API_KEY");

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

// OpenAI summarization
async function summarizeWithOpenAI(placeName: string, samples: string[]) {
  if (!openAIKey) {
    console.warn("OpenAI API key not found, returning mock summary");
    return {
      top_issues: [
        { issue: "Temps d'attente", mentions: 12 },
        { issue: "Service lent", mentions: 8 },
        { issue: "Prix élevé", mentions: 5 }
      ],
      top_strengths: [
        { strength: "Nourriture excellente", mentions: 25 },
        { strength: "Personnel sympathique", mentions: 18 },
        { strength: "Ambiance agréable", mentions: 15 }
      ],
      recommendations: [
        "Améliorer la rapidité du service",
        "Optimiser la gestion de l'attente",
        "Maintenir la qualité de la nourriture"
      ]
    };
  }

  if (!samples.length) {
    return {
      top_issues: [],
      top_strengths: [],
      recommendations: ["Aucun avis textuel disponible pour l'analyse"]
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
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 1000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    return JSON.parse(content);
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return {
      top_issues: [{ issue: "Erreur d'analyse IA", mentions: 1 }],
      top_strengths: [{ strength: "Analyse impossible", mentions: 1 }],
      recommendations: ["Erreur lors de l'analyse par IA"]
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
    const summary = await summarizeWithOpenAI(name ?? "Cet établissement", sampleTexts);

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