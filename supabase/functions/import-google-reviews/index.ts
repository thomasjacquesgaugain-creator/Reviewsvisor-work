import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(origin?: string | null): Record<string, string> {
  const allowOrigin =
    origin === "http://localhost:8080" || origin === "http://localhost:5173"
      ? origin
      : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };
}

interface OutscraperReviewRow {
  author_title?: string;
  author_name?: string;
  autor_name?: string;
  name?: string;
  rating?: number | string;
  review_rating?: number | string;
  review_text?: string;
  review?: string;
  text?: string;
  review_datetime_utc?: string;
  review_timestamp?: number;
  date?: string;
  id?: string;
  [key: string]: unknown;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const responseCorsHeaders = { ...corsHeaders, "Content-Type": "application/json" };
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: responseCorsHeaders }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: responseCorsHeaders }
      );
    }

    let body: { placeId?: string; limit?: number; name?: string; address?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: responseCorsHeaders }
      );
    }

    const placeId = body.placeId?.trim();
    const limit = typeof body.limit === "number" ? Math.min(Math.max(1, body.limit), 3000) : 2000;
    if (!placeId) {
      return new Response(
        JSON.stringify({ error: "placeId is required" }),
        { status: 400, headers: responseCorsHeaders }
      );
    }

    let nom = (body.name != null && String(body.name).trim()) ? String(body.name).trim() : "";
    let adresse = (body.address != null && String(body.address).trim()) ? String(body.address).trim() : "";
    if (!nom || !adresse) {
      const { data: etab } = await supabase
        .from("établissements")
        .select("nom, adresse")
        .eq("user_id", user.id)
        .eq("place_id", placeId)
        .maybeSingle();
      if (!nom) nom = (etab?.nom ?? "").trim();
      if (!adresse) adresse = (etab?.adresse ?? "").trim();
    }

    const parts = [nom, adresse].filter(Boolean);
    const outscraperQuery = parts.length ? parts.join(", ") + ", France" : placeId;

    console.log("[import-google-reviews] Envoi Outscraper:", {
      placeId,
      source: parts.length ? "nom+adresse (body ou BDD)" : "place_id",
      query: outscraperQuery,
    });

    const apiKey =
      Deno.env.get("OUTSCRAPER_API_KEY") ||
      Deno.env.get("VITE_OUTSCRAPER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "Outscraper API key not configured",
          hint: "Set OUTSCRAPER_API_KEY in Supabase Edge Function secrets",
        }),
        { status: 500, headers: responseCorsHeaders }
      );
    }

    const url = new URL("https://api.app.outscraper.com/maps/reviews-v2");
    url.searchParams.set("query", outscraperQuery);
    url.searchParams.set("reviewsLimit", String(limit));
    url.searchParams.set("sort", "newest");
    url.searchParams.set("language", "fr");

    console.log("[import-google-reviews] URL Outscraper (sans clé):", url.origin + url.pathname + "?" + url.searchParams.toString());

    const outRes = await fetch(url.toString(), {
      method: "GET",
      headers: { "X-API-KEY": apiKey },
    });

    const rawText = await outRes.text();
    let outData: unknown;
    try {
      outData = JSON.parse(rawText);
    } catch {
      outData = rawText;
    }
    console.log("[import-google-reviews] Réponse brute Outscraper:", { status: outRes.status, ok: outRes.ok, body: outData });

    if (!outRes.ok) {
      console.error("[import-google-reviews] Outscraper error:", outRes.status, rawText?.slice(0, 300));
      return new Response(
        JSON.stringify({
          error: "Outscraper API error",
          status: outRes.status,
          details: (typeof rawText === "string" ? rawText : JSON.stringify(outData)).slice(0, 500),
        }),
        { status: 502, headers: responseCorsHeaders }
      );
    }

    const outDataTyped = outData as OutscraperReviewRow[][] | OutscraperReviewRow[] | { data?: OutscraperReviewRow[] };
    let rows: OutscraperReviewRow[] = [];
    if (Array.isArray(outDataTyped)) {
      rows = Array.isArray(outDataTyped[0]) ? (outDataTyped[0] as OutscraperReviewRow[]) : (outDataTyped as OutscraperReviewRow[]);
    } else if (outDataTyped && typeof outDataTyped === "object" && Array.isArray((outDataTyped as any).data)) {
      rows = (outDataTyped as any).data;
    }

    if (!rows.length) {
      return new Response(
        JSON.stringify({
          success: true,
          total: 0,
          inserted: 0,
          skipped: 0,
          message: "Aucun avis trouvé pour ce lieu",
        }),
        { status: 200, headers: responseCorsHeaders }
      );
    }

    // Récupérer les avis existants (même place_id, user_id) pour déduplication par (author_name, published_at)
    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("author_name, published_at")
      .eq("place_id", placeId)
      .eq("user_id", user.id)
      .in("source", ["outscraper", "google"]);

    const existingSet = new Set(
      (existingReviews ?? []).map(
        (r) => `${(r.author_name ?? "").trim()}|${(r.published_at ?? "").slice(0, 19)}`
      )
    );

    let inserted = 0;
    let skipped = 0;
    const source = "outscraper";

    for (const r of rows) {
      const authorName = (r.author_title ?? r.author_name ?? r.autor_name ?? r.name ?? "").trim();
      const ratingRaw = r.review_rating ?? r.rating;
      const rating =
        typeof ratingRaw === "number"
          ? Math.min(5, Math.max(1, ratingRaw))
          : (parseInt(String(ratingRaw ?? 0), 10) || null);
      const text = (r.review_text ?? r.review ?? r.text ?? "").trim();
      const dateRaw = r.review_datetime_utc ?? r.date ?? "";
      const publishedAt = dateRaw ? new Date(dateRaw).toISOString().slice(0, 19) : "";
      const dedupKey = `${authorName}|${publishedAt}`;
      if (existingSet.has(dedupKey)) {
        skipped++;
        continue;
      }
      const sourceReviewId = `outscraper_${placeId}_${authorName}_${publishedAt}`.replace(/\s/g, "_");
      const reviewData = {
        user_id: user.id,
        place_id: placeId,
        source,
        source_review_id: sourceReviewId,
        review_id_ext: sourceReviewId,
        author_name: authorName || null,
        author: authorName || null,
        rating,
        text: text || null,
        published_at: dateRaw || null,
        create_time: dateRaw || null,
        raw: r,
      };

      const { error: insertError } = await supabase.from("reviews").insert(reviewData);
      if (insertError) {
        if (insertError.code === "23505") {
          skipped++;
          existingSet.add(dedupKey);
        } else {
          console.error("[import-google-reviews] Insert error:", insertError);
        }
        continue;
      }
      inserted++;
      existingSet.add(dedupKey);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: rows.length,
        inserted,
        skipped,
      }),
      { status: 200, headers: responseCorsHeaders }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[import-google-reviews] Exception:", message, err);
    const origin = req.headers.get("Origin");
    const catchCors = getCorsHeaders(origin);
    return new Response(
      JSON.stringify({ error: "Internal server error", message }),
      { status: 500, headers: { ...catchCors, "Content-Type": "application/json" } }
    );
  }
});
