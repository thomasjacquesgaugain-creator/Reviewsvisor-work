// supabase/functions/analyze-reviews/index.ts
// Deno Edge Function (TypeScript)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

type NormalizedReview = {
  source: "google";
  place_id: string;
  review_id: string;
  author_name: string | null;
  author_uri: string | null;
  rating: number | null;
  text: string | null;
  publish_time: string | null;
  language: string;
};

type ReviewRow = {
  source: "google";
  review_id: string;
  place_id: string;
  rating: number | null;
  text: string | null;
  author_name: string | null;
  author_uri: string | null;
  publish_time: string | null;
  language: string;
  created_at: string;
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
  // compat anciennes/ nouvelles variables
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

// Helper pour récupérer JSON avec gestion d'erreur
async function safeJson(res: Response) {
  try { 
    return await res.json(); 
  } catch { 
    return { text: await res.text() }; 
  }
}

// Génère un ID aléatoire
function cryptoRandomId() { 
  return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`); 
}

// Normalise un avis Google vers notre format standard
function normalizeGoogleReview(place_id: string, language: string, r: any): NormalizedReview {
  const name = r?.name || ""; // ex: "places/XXX/reviews/YYY"
  const review_id = name.split("/").pop() || cryptoRandomId();
  const author = r?.authorAttribution ?? {};
  
  return {
    source: "google",
    place_id,
    review_id,
    author_name: author.displayName ?? null,
    author_uri: author.uri ?? null,
    rating: typeof r?.rating === "number" ? r.rating : null,
    text: r?.text?.text ?? r?.originalText?.text ?? r?.text ?? null,
    publish_time: r?.publishTime ?? null,
    language,
  };
}

// Récupération robuste des avis Google avec stratégie A/B
async function fetchGoogleReviewsAll(placeId: string, language = "fr") {
  const key = Deno.env.get("GOOGLE_PLACES_API_KEY") ?? Deno.env.get("GOOGLE_API_KEY") ?? "";
  if (!key) throw new Error("missing_google_key");
  
  const base = "https://places.googleapis.com/v1";
  const headers = { "X-Goog-Api-Key": key };
  const reviews: any[] = [];
  const logs: any[] = [];

  // A) Route dédiée reviews (pagination)
  let usedA = false;
  try {
    usedA = true;
    let pageToken = "";
    for (let i = 0; i < 50; i++) { // garde-fou
      const u = new URL(`${base}/places/${placeId}/reviews`);
      u.searchParams.set("maxResultCount", "10");
      u.searchParams.set("languageCode", language);
      if (pageToken) u.searchParams.set("pageToken", pageToken);

      logs.push({ step: "google_reviews_call", url: u.toString(), iteration: i + 1 });
      const r = await fetch(u, { headers });
      
      if (r.status === 404) { 
        logs.push({ step: "google_reviews_404", message: "Route /reviews non disponible, fallback vers /places" });
        usedA = false; 
        break; 
      }
      
      if (!r.ok) {
        const e = await safeJson(r);
        logs.push({ step: "google_reviews_error", status: r.status, error: e });
        throw new Error(`google_fetch_failed:${r.status}:${JSON.stringify(e)}`);
      }
      
      const j = await r.json();
      if (Array.isArray(j.reviews)) {
        reviews.push(...j.reviews);
        logs.push({ step: "google_reviews_success", reviews_count: j.reviews.length, total_so_far: reviews.length });
      }
      
      if (j.nextPageToken) {
        pageToken = j.nextPageToken;
        // Pause pour éviter le rate limiting
        await new Promise(res => setTimeout(res, 500));
      } else {
        logs.push({ step: "google_reviews_complete", total_pages: i + 1 });
        break;
      }
    }
  } catch (e) {
    logs.push({ step: "google_reviews_error", error: String(e) });
    if (usedA) throw e; // si on a vraiment tenté A et que ce n'est pas un 404, on remonte
  }

  // B) Fallback Place Details (5 avis pertinents)
  if (!usedA || reviews.length === 0) {
    logs.push({ step: "fallback_to_place_details", reason: usedA ? "no_reviews_found" : "reviews_route_unavailable" });
    
    const u = new URL(`${base}/places/${placeId}`);
    u.searchParams.set("fields", "overallRating,reviewCount,reviews");
    u.searchParams.set("languageCode", language);
    
    logs.push({ step: "google_details_call", url: u.toString() });
    const r = await fetch(u, { headers });
    
    if (!r.ok) {
      const e = await safeJson(r);
      logs.push({ step: "google_details_error", status: r.status, error: e });
      throw new Error(`google_fetch_failed:${r.status}:${JSON.stringify(e)}`);
    }
    
    const j = await r.json();
    if (Array.isArray(j.reviews)) {
      reviews.push(...j.reviews);
      logs.push({ step: "google_details_success", reviews_count: j.reviews.length });
    }
    
    return { 
      reviews, 
      meta: { rating: j.overallRating ?? null, total: j.reviewCount ?? null }, 
      logs 
    };
  }
  
  logs.push({ step: "final_count", total_reviews: reviews.length });
  return { reviews, meta: { rating: null, total: null }, logs };
}

// Simple agrégateur (note moyenne, %)
function computeStats(rows: NormalizedReview[]) {
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

// Résumé IA (facultatif si pas de clé)
async function summarizeWithOpenAI(placeName: string, samples: string[]) {
  if (!OPENAI_KEY) {
    return { top_issues: [], top_strengths: [], recommendations: [] };
  }

  // Petits lots pour éviter les tokens
  const chunks: string[][] = [];
  for (let i = 0; i < samples.length; i += 10) chunks.push(samples.slice(i, i + 10));

  // Merge des résumés
  let issues: string[] = [];
  let strengths: string[] = [];
  let recos: string[] = [];

  for (const chunk of chunks) {
    const prompt = [
      { role: "system", content: "Tu es un analyste qui synthétise des avis clients en français. Réponds exclusivement en JSON." },
      { role: "user", content:
`Établissement: ${placeName}
Avis (échantillon):
${chunk.map((t,i)=>`${i+1}. ${t}`).join("\n")}

Retourne strictement ce JSON:
{
  "top_issues": ["..."],       // 3 problèmes les plus récurrents (phrases courtes)
  "top_strengths": ["..."],    // 3 points forts
  "recommendations": ["..."]   // 3 actions concrètes
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
      const j = JSON.parse(txt);
      issues.push(...(j.top_issues ?? []));
      strengths.push(...(j.top_strengths ?? []));
      recos.push(...(j.recommendations ?? []));
    } catch {}
  }

  // Dédupliquer et tronquer à 3
  const uniq = (arr: string[]) => [...new Set(arr.map(s=>s.trim()))].filter(Boolean).slice(0,3);
  return { top_issues: uniq(issues), top_strengths: uniq(strengths), recommendations: uniq(recos) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  const allLogs: any[] = [];
  
  try {
    // Auth utilisateur (si dispo)
    const auth = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (auth.toLowerCase().startsWith("bearer ")) {
      try {
        const { data } = await supabaseAdmin.auth.getUser(auth.split(" ")[1]);
        userId = data.user?.id ?? null;
        allLogs.push({ step: "auth_success", user_id: userId });
      } catch (e) {
        allLogs.push({ step: "auth_failed", error: String(e) });
      }
    }

    // Parse body avec validation
    const body = await req.json().catch(() => ({}));
    const { place_id, language = "fr", dryRun = false, name } = body;
    
    if (!place_id) {
      allLogs.push({ step: "validation_error", error: "missing_place_id" });
      return json({ ok: false, error: "missing_place_id", logs: allLogs }, 400);
    }
    
    allLogs.push({ step: "params", place_id, language, dryRun, name });

    // 1) Fetch Google Reviews avec stratégie robuste
    const { reviews: gReviews, meta, logs: fetchLogs } = await fetchGoogleReviewsAll(place_id, language);
    allLogs.push(...fetchLogs);

    // 2) Normaliser les reviews
    const normalizedReviews: NormalizedReview[] = gReviews.map(r => 
      normalizeGoogleReview(place_id, language, r)
    );
    
    allLogs.push({ step: "normalized", count: normalizedReviews.length });

    // Si dryRun, on retourne sans écrire en base
    if (dryRun) {
      const stats = computeStats(normalizedReviews);
      return json({
        ok: true,
        counts: { google: normalizedReviews.length, collected: normalizedReviews.length },
        sample: normalizedReviews.slice(0, 5),
        g_meta: { total: meta.total, rating: meta.rating },
        logs: allLogs
      });
    }

    // 3) Créer la table reviews si elle n'existe pas
    try {
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.reviews (
            source TEXT NOT NULL,
            review_id TEXT NOT NULL,
            place_id TEXT NOT NULL,
            rating NUMERIC,
            text TEXT,
            author_name TEXT,
            author_uri TEXT,
            publish_time TIMESTAMPTZ,
            language TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            PRIMARY KEY (source, review_id)
          );
        `
      });
      allLogs.push({ step: "table_creation", status: "success" });
    } catch (e) {
      // La table existe probablement déjà, on continue
      allLogs.push({ step: "table_creation", status: "skipped", error: String(e) });
    }

    // 4) Upsert en base (service role, RLS bypass)
    if (normalizedReviews.length > 0) {
      const rows: ReviewRow[] = normalizedReviews.map(r => ({
        source: r.source,
        review_id: r.review_id,
        place_id: r.place_id,
        rating: r.rating,
        text: r.text,
        author_name: r.author_name,
        author_uri: r.author_uri,
        publish_time: r.publish_time,
        language: r.language,
        created_at: new Date().toISOString(),
      }));

      const { data: insertedData, error } = await supabaseAdmin
        .from("reviews")
        .upsert(rows, { onConflict: "source,review_id" })
        .select("review_id");
        
      if (error) {
        allLogs.push({ step: "upsert_error", error: error.message });
        throw new Error(`upsert_failed: ${error.message}`);
      }
      
      const inserted = insertedData?.length ?? 0;
      allLogs.push({ step: "upsert_success", inserted, total: rows.length });
    }

    // 5) Stats + IA
    const stats = computeStats(normalizedReviews);
    const sampleTexts = normalizedReviews.map(r => r.text ?? "").filter(Boolean).slice(0, 120);
    const summary = await summarizeWithOpenAI(name ?? "Cet établissement", sampleTexts);
    
    allLogs.push({ step: "analysis_complete", stats: { total: stats.total, avg: stats.overall } });

    // 6) Sauvegarder les insights
    const { error: insightsError } = await supabaseAdmin.from("review_insights").upsert({
      place_id,
      user_id: userId ?? "00000000-0000-0000-0000-000000000000",
      last_analyzed_at: new Date().toISOString(),
      counts: { 
        total: stats.total, 
        by_rating: stats.by_rating, 
        positive_pct: stats.positive_pct, 
        negative_pct: stats.negative_pct 
      },
      overall_rating: stats.overall,
      top_issues: summary.top_issues,
      top_strengths: summary.top_strengths,
      recommendations: summary.recommendations,
    });
    
    if (insightsError) {
      allLogs.push({ step: "insights_error", error: insightsError.message });
    } else {
      allLogs.push({ step: "insights_success" });
    }

    return json({
      ok: true,
      counts: { google: normalizedReviews.length, collected: normalizedReviews.length },
      g_meta: { rating: stats.overall, total: stats.total },
      logs: allLogs
    });
    
  } catch (e) {
    const errorMessage = String(e?.message ?? e);
    allLogs.push({ step: "final_error", error: errorMessage });
    
    // Parse Google API error if available
    let details = null;
    if (errorMessage.includes("google_fetch_failed:")) {
      try {
        const parts = errorMessage.split(":");
        const status = parts[1];
        const payload = parts.slice(2).join(":");
        details = { status, payload: JSON.parse(payload) };
      } catch {
        details = { raw_error: errorMessage };
      }
    }

    return json({ 
      ok: false, 
      error: errorMessage,
      details,
      logs: allLogs 
    }, 200); // 200 pour ne pas casser le front
  }
});