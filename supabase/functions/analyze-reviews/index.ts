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

  // Places API v1 nécessite le nom de ressource: places/{placeId}
  const id = encodeURIComponent(placeId.replace(/^places\//, ""));
  const base = `https://places.googleapis.com/v1/places/${id}/reviews`;
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

// Heuristic theming if AI is unavailable or returns empty
function computeHeuristicThemes(rows: ReviewRow[]) {
  const themes: Record<string, number> = {
    'Service': 0,
    'Cuisine': 0,
    'Ambiance': 0,
    'Propreté': 0,
    'Rapport qualité/prix': 0,
    'Rapidité': 0,
    'Emplacement': 0,
  };
  const dict: Record<string, string[]> = {
    'Service': ['service','serveur','serveuse','accueil','personnel'],
    'Cuisine': ['cuisine','plat','plats','nourriture','repas','goût','qualité','cuisson','menu'],
    'Ambiance': ['ambiance','atmosphère','musique','bruit','calme','décor'],
    'Propreté': ['propreté','sale','propre','hygiène','toilettes'],
    'Rapport qualité/prix': ['prix','cher','coût','bon marché','rapport','addition','facture'],
    'Rapidité': ['rapide','attente','lent','vite','délai'],
    'Emplacement': ['emplacement','localisation','situation','parking'],
  };
  for (const r of rows) {
    const t = (r.text ?? '').toLowerCase();
    if (!t) continue;
    for (const [label, keys] of Object.entries(dict)) {
      if (keys.some(k => t.includes(k))) themes[label]++;
    }
  }
  return Object.entries(themes)
    .map(([theme, count]) => ({ theme, count }))
    .filter(x => x.count > 0)
    .sort((a,b) => b.count - a.count)
    .slice(0, 6);
}

// Résumé IA (facultatif si pas de clé)
async function summarizeWithOpenAI(placeName: string, samples: string[], totalReviews: number) {
  if (!OPENAI_KEY) {
    return { top_issues: [], top_strengths: [], recommendations: [] };
  }

  // Analyse globale de tous les avis
  const allText = samples.join("\n");
  
  const prompt = [
    { role: "system", content: "Tu es un analyste qui synthétise des avis clients en français. Réponds exclusivement en JSON." },
    { role: "user", content:
`Établissement: ${placeName}
Total d'avis analysés: ${totalReviews}

Avis:
${samples.slice(0, 100).map((t,i)=>`${i+1}. ${t}`).join("\n")}

Analyse ces avis et retourne strictement ce JSON:
{
  "top_issues": [
    {"theme": "Nom du problème", "count": nombre_estimé_occurrences},
    {"theme": "Autre problème", "count": nombre_estimé_occurrences},
    {"theme": "Troisième problème", "count": nombre_estimé_occurrences}
  ],
  "top_strengths": [
    {"theme": "Point fort", "count": nombre_estimé_occurrences},
    {"theme": "Autre point fort", "count": nombre_estimé_occurrences},
    {"theme": "Troisième point fort", "count": nombre_estimé_occurrences}
  ],
  "themes": [
    {"theme": "Service", "count": 45},
    {"theme": "Cuisine", "count": 67},
    {"theme": "Ambiance", "count": 30},
    {"theme": "Rapport qualité/prix", "count": 25},
    {"theme": "Propreté", "count": 20}
  ],
  "recommendations": ["action 1", "action 2", "action 3"]
}

INSTRUCTIONS POUR LES THÉMATIQUES:
- Identifie les 5-7 thématiques les PLUS mentionnées dans les avis
- Utilise des noms simples et clairs: "Service", "Cuisine", "Ambiance", "Propreté", "Rapport qualité/prix", "Cadre", "Emplacement", "Parking", etc.
- Pour chaque thématique, compte combien d'avis (sur ${totalReviews}) en parlent
- Un avis peut mentionner plusieurs thématiques
- Le count doit être un nombre entier réaliste entre 5 et ${totalReviews}
- Exemple: si 45 avis sur ${totalReviews} parlent du service, retourne {"theme": "Service", "count": 45}`
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
    return {
      top_issues: (j.top_issues ?? []).slice(0, 3),
      top_strengths: (j.top_strengths ?? []).slice(0, 3),
      themes: (j.themes ?? []).slice(0, 6),
      recommendations: (j.recommendations ?? []).slice(0, 3)
    };
  } catch {
    return { top_issues: [], top_strengths: [], themes: [], recommendations: [] };
  }
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

    // 1) Récupération des avis Google (avec fallback BDD en cas d'échec)
    let rows: ReviewRow[] = [];
    let fetchedFrom: "google" | "database" = "google";
    try {
      const gReviews = await fetchAllGoogleReviews(place_id);
      // 2) Map en rows pour upsert
      rows = gReviews.map((r: any) => {
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
    } catch (err) {
      console.warn("google_fetch_failed, fallback to database:", err);
      fetchedFrom = "database";
      const { data: existing, error: exErr } = await supabaseAdmin
        .from("reviews")
        .select("user_id, place_id, source, source_review_id, rating, text, language, published_at, author, url")
        .eq("place_id", place_id)
        .eq("user_id", userId ?? "00000000-0000-0000-0000-000000000000");
      if (exErr) throw new Error(`fallback_select_failed:${exErr.message}`);
      rows = (existing ?? []).map((r: any) => ({
        user_id: r.user_id,
        place_id: r.place_id,
        source: (r.source ?? "google"),
        remote_id: r.source_review_id ?? crypto.randomUUID(),
        rating: r.rating ?? null,
        text: r.text ?? null,
        language_code: r.language ?? null,
        published_at: r.published_at ?? null,
        author_name: r.author ?? null,
        author_url: r.url ?? null,
        author_photo_url: null,
        like_count: null,
      }));
    }

    // 3) Upsert (service role, RLS bypass) uniquement si on a récupéré Google
    if (!dryRun && rows.length && fetchedFrom === "google") {
      const { error } = await supabaseAdmin.from("reviews")
        .upsert(rows, { onConflict: "source,remote_id" })
        .select("id");
      if (error) throw new Error(`upsert_failed:${error.message}`);
    }

    // 4) Stats + IA
    const stats = computeStats(rows);
    const sampleTexts = rows.map(r => r.text ?? "").filter(Boolean).slice(0, 120);
    const summary = await summarizeWithOpenAI(name ?? "Cet établissement", sampleTexts, rows.length);
    const themesComputed = (summary?.themes && summary.themes.length)
      ? summary.themes
      : computeHeuristicThemes(rows);

    if (!dryRun) {
      const { error } = await supabaseAdmin.from("review_insights").upsert({
        place_id,
        user_id: userId ?? "00000000-0000-0000-0000-000000000000", // fallback
        last_analyzed_at: new Date().toISOString(),
        total_count: stats.total,
        avg_rating: stats.overall,
        positive_ratio: stats.positive_pct / 100,
        top_issues: summary.top_issues.map((issue: any, idx: number) => ({ 
          theme: issue.theme || issue,
          count: issue.count || 0,
          severity: idx < 1 ? 'high' : 'medium' 
        })),
        top_praises: summary.top_strengths.map((strength: any, idx: number) => ({ 
          theme: strength.theme || strength,
          count: strength.count || 0
        })),
        themes: themesComputed.map((theme: any) => ({
          theme: theme.theme,
          count: theme.count || 0
        })),
        summary: {
          total: stats.total,
          by_rating: stats.by_rating,
          positive_pct: stats.positive_pct,
          negative_pct: stats.negative_pct,
          recommendations: summary.recommendations
        }
      }, { onConflict: 'place_id,user_id' });
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