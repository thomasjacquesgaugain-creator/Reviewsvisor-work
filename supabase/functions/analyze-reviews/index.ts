// supabase/functions/analyze-reviews/index.ts
// Deno Edge Function (TypeScript)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/dotenv@v3.2.2/load.ts";

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

// Google Places API v1 - list all reviews with pagination
async function fetchAllGoogleReviews(placeId: string) {
  if (!GOOGLE_KEY) throw new Error("missing_google_key");

  const base = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}/reviews`;
  const headers: HeadersInit = {
    "X-Goog-Api-Key": GOOGLE_KEY,
    // on liste les champs utiles (field mask obligatoire en v1)
    "X-Goog-FieldMask":
      "reviews.name,reviews.rating,reviews.text.text,reviews.publishTime," +
      "reviews.authorAttribution.displayName,reviews.authorAttribution.uri," +
      "reviews.authorAttribution.photoUri,nextPageToken",
  };

  let pageToken = "";
  const out: any[] = [];

  for (let i = 0; i < 100; i++) { // garde-fou
    const url = new URL(base);
    url.searchParams.set("pageSize", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const r = await fetch(url.toString(), { headers });
    if (!r.ok) {
      const e = await r.text();
      throw new Error(`google_fetch_failed: ${r.status} ${e}`);
    }
    const j = await r.json();
    const reviews = j.reviews ?? [];
    out.push(...reviews);

    pageToken = j.nextPageToken ?? "";
    if (!pageToken) break;

    // la v1 impose parfois une petite pause
    await new Promise(res => setTimeout(res, 900));
  }

  return out;
}

// Simple agrégateur (note moyenne, %)
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

  try {
    // Auth utilisateur (si dispo)
    const auth = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (auth.toLowerCase().startsWith("bearer ")) {
      try {
        const { data } = await supabaseAdmin.auth.getUser(auth.split(" ")[1]);
        userId = data.user?.id ?? null;
      } catch {}
    }

    const { place_id, name, dryRun = false } = await req.json().catch(()=>({}));
    if (!place_id) return json({ ok:false, error:"missing_place_id" }, 400);

    // 1) Fetch Google Reviews (pagination)
    const gReviews = await fetchAllGoogleReviews(place_id);

    // 2) Map en rows pour upsert
    const rows: ReviewRow[] = gReviews.map((r: any) => {
      // r.name ressemble à: "places/ChIJ.../reviews/abc123"
      const remote_id = String(r.name ?? "").split("/").pop() ?? crypto.randomUUID();
      return {
        user_id: userId,
        place_id,
        source: "google",
        remote_id,
        rating: r.rating ?? null,
        text: r.text?.text ?? null,
        language_code: null,
        published_at: r.publishTime ?? null,
        author_name: r.authorAttribution?.displayName ?? null,
        author_url: r.authorAttribution?.uri ?? null,
        author_photo_url: r.authorAttribution?.photoUri ?? null,
        like_count: null,
      };
    });

    // 3) Upsert (service role, RLS bypass)
    if (!dryRun && rows.length) {
      const { error } = await supabaseAdmin.from("reviews")
        .upsert(rows, { onConflict: "source,remote_id" })
        .select("id");
      if (error) throw new Error(`upsert_failed:${error.message}`);
    }

    // 4) Stats + IA
    const stats = computeStats(rows);
    const sampleTexts = rows.map(r => r.text ?? "").filter(Boolean).slice(0, 120);
    const summary = await summarizeWithOpenAI(name ?? "Cet établissement", sampleTexts);

    if (!dryRun) {
      const { error } = await supabaseAdmin.from("review_insights").upsert({
        place_id,
        user_id: userId ?? "00000000-0000-0000-0000-000000000000", // fallback
        last_analyzed_at: new Date().toISOString(),
        total_count: stats.total,
        avg_rating: stats.overall,
        positive_ratio: stats.positive_pct / 100,
        top_issues: summary.top_issues,
        top_praises: summary.top_strengths,
        summary: {
          recommendations: summary.recommendations,
          analysis_date: new Date().toISOString()
        }
      });
      if (error) throw new Error(`insights_upsert_failed:${error.message}`);
    }

    return json({
      ok: true,
      counts: { collected: rows.length, google: rows.length, yelp: 0 },
      g_meta: { rating: stats.overall, total: stats.total },
      dryRun
    });
  } catch (e) {
    return json({ ok:false, error: String(e?.message ?? e) }, 500);
  }
});