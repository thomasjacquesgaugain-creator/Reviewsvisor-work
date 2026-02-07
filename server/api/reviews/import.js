/**
 * Handler pour POST /api/reviews/import (utilisé par le middleware Vite en dev).
 * Utilise les mêmes variables que le reste de l'app (chargées via loadEnv dans vite.config) :
 * - VITE_SUPABASE_URL (comme src/integrations/supabase/client.ts)
 * - VITE_SUPABASE_ANON_KEY ou VITE_SUPABASE_PUBLISHABLE_KEY (comme client)
 * - OUTSCRAPER_API_KEY
 *
 * Body requis : placeId, name, address. La query Outscraper est construite en "[name], [address], France"
 * et passée au SDK (reviews-v3), pas le place_id.
 */

import { createClient } from "@supabase/supabase-js";
import Outscraper from "outscraper";

export async function handleImportReviews(body, authHeader, env = {}) {
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_ANON_KEY;
  const apiKey = env.OUTSCRAPER_API_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[api/reviews/import] Supabase non configuré. Variables reçues:", {
      hasViteSupabaseUrl: !!env.VITE_SUPABASE_URL,
      hasSupabaseUrl: !!env.SUPABASE_URL,
      hasViteSupabaseAnonKey: !!env.VITE_SUPABASE_ANON_KEY,
      hasViteSupabasePublishableKey: !!env.VITE_SUPABASE_PUBLISHABLE_KEY,
      hasSupabaseAnonKey: !!env.SUPABASE_ANON_KEY,
      urlLength: supabaseUrl ? String(supabaseUrl).length : 0,
      keyLength: supabaseAnonKey ? String(supabaseAnonKey).length : 0,
    });
    return {
      status: 500,
      data: {
        error: "Supabase not configured",
        hint: "Vérifiez que .env contient VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY).",
      },
    };
  }
  if (!authHeader) {
    console.error("[api/reviews/import] Requête sans header Authorization");
    return { status: 401, data: { error: "Unauthorized" } };
  }
  if (!apiKey) {
    console.error("[api/reviews/import] OUTSCRAPER_API_KEY manquante dans .env");
    return {
      status: 500,
      data: {
        error: "Outscraper API key not configured",
        hint: "Ajoutez OUTSCRAPER_API_KEY dans le fichier .env à la racine du projet.",
      },
    };
  }

  console.log("[api/reviews/import] Config OK (Supabase + Outscraper), vérification auth...");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error("[api/reviews/import] Auth échouée:", userError?.message || "no user");
    return { status: 401, data: { error: "Unauthorized" } };
  }

  const placeId = body.placeId?.trim();
  const limit = typeof body.limit === "number" ? Math.min(Math.max(1, body.limit), 3000) : 2000;
  if (!placeId) {
    console.error("[api/reviews/import] Body invalide: placeId manquant");
    return { status: 400, data: { error: "placeId is required" } };
  }

  const name = (body.name != null && String(body.name).trim()) ? String(body.name).trim() : "";
  const address = (body.address != null && String(body.address).trim()) ? String(body.address).trim() : "";
  if (!name || !address) {
    console.error("[api/reviews/import] Body invalide: name et address requis pour la query Outscraper");
    return { status: 400, data: { error: "name and address are required" } };
  }

  const query = `${name}, ${address}, France`;
  console.log("[api/reviews/import] place_id:", placeId, "limit:", limit, "query:", query);

  let rows = [];
  try {
    const client = new Outscraper(apiKey);
    const response = await client.googleMapsReviews(
      [query],
      limit,
      null,
      1,
      "newest",
      null,
      null,
      null,
      null,
      false,
      "google",
      "fr",
      null,
      "",
      false
    );
    console.log("[api/reviews/import] Réponse brute Outscraper (avant normalisation):", response);

    if (response?.error || response?.errorMessage) {
      console.error("[api/reviews/import] Outscraper error:", response.error || response.errorMessage);
      return {
        status: 502,
        data: { error: "Outscraper API error", details: response.error || response.errorMessage },
      };
    }

    const data = Array.isArray(response) ? response : response?.data ?? response;
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      if (first?.reviews_data && Array.isArray(first.reviews_data)) {
        rows = first.reviews_data;
      } else if (Array.isArray(first)) {
        rows = first;
      } else {
        rows = data;
      }
    }
  } catch (e) {
    console.error("[api/reviews/import] Erreur Outscraper:", e);
    return { status: 502, data: { error: "Outscraper request failed", message: String(e?.message || e) } };
  }

  if (rows.length) {
    console.log("[api/reviews/import] Nombre d'avis reçus:", rows.length, "| Premier avis brut (debug):", JSON.stringify(rows[0])?.slice(0, 400));
  }
  if (!rows.length) {
    console.log("[api/reviews/import] Aucun avis extrait de la réponse Outscraper.");
    return {
      status: 200,
      data: { success: true, total: 0, inserted: 0, skipped: 0, message: "Aucun avis trouvé pour ce lieu" },
    };
  }

  const { data: existingReviews } = await supabase
    .from("reviews")
    .select("author_name, published_at")
    .eq("place_id", placeId)
    .eq("user_id", user.id)
    .in("source", ["outscraper", "google"]);

  const existingSet = new Set(
    (existingReviews ?? []).map((r) => `${(r.author_name ?? "").trim()}|${(r.published_at ?? "").slice(0, 19)}`)
  );

  let inserted = 0;
  let skipped = 0;
  const source = "outscraper";

  for (const r of rows) {
    const authorName = (r.author_title ?? r.author_name ?? r.autor_name ?? r.name ?? "").trim();
    const ratingRaw = r.review_rating ?? r.rating;
    const rating = typeof ratingRaw === "number" ? Math.min(5, Math.max(1, ratingRaw)) : (parseInt(String(ratingRaw ?? 0), 10) || null);
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
      }
      continue;
    }
    inserted++;
    existingSet.add(dedupKey);
  }

  return {
    status: 200,
    data: { success: true, total: rows.length, inserted, skipped },
  };
}
