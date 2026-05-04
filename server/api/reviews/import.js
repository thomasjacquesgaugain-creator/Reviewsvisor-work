// This endpoint for importing reviews has been deprecated ,as we are using edge function to import reviews via outscraper (outscraper-google-reviews)


/**
 * Handler pour POST /api/reviews/import (utilisé par le middleware Vite en dev).
 * Utilise les variables backend (chargées via loadEnv dans vite.config) :
 * - SUPABASE_URL
 * - SUPABASE_ANON_KEY
 * - OUTSCRAPER_API_KEY
 *
 * Body requis : placeId, name, address. La query Outscraper est construite en "[name], [address]"
 * et passée au SDK (reviews-v3), pas le place_id.
 */

import { createClient } from "@supabase/supabase-js";
import Outscraper from "outscraper";

function simpleHash(text) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

export async function handleImportReviews(body, authHeader, env = {}) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseAnonKey = env.SUPABASE_ANON_KEY;
  const apiKey = env.OUTSCRAPER_API_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[api/reviews/import] Supabase non configuré. Variables reçues:", {
      hasSupabaseUrl: !!env.SUPABASE_URL,
      hasSupabaseAnonKey: !!env.SUPABASE_ANON_KEY,
      urlLength: supabaseUrl ? String(supabaseUrl).length : 0,
      keyLength: supabaseAnonKey ? String(supabaseAnonKey).length : 0,
    });
    return {
      status: 500,
      data: {
        error: "Supabase not configured",
        hint: "Vérifiez que .env contient SUPABASE_URL et SUPABASE_ANON_KEY.",
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

  const sourceParam = (body.source && ["google", "tripadvisor", "trustpilot"].includes(String(body.source).toLowerCase()))
    ? String(body.source).toLowerCase()
    : "google";
  const forceFullImport = !!body.forceFullImport;
  const query = `${name}, ${address}`;

  let cutoffTimestamp = null;
  if (sourceParam === "google" && !forceFullImport) {
    const { data: etabRow } = await supabase
      .from("establishments")
      .select("last_reviews_import")
      .eq("place_id", placeId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (etabRow?.last_reviews_import) {
      const lastImportDate = new Date(etabRow.last_reviews_import);
      const bufferMs = 24 * 60 * 60 * 1000;
      cutoffTimestamp = Math.floor((lastImportDate.getTime() - bufferMs) / 1000);
      console.log("[api/reviews/import] Import incrémental depuis le", lastImportDate.toISOString(), "| cutoff (s):", cutoffTimestamp);
    }
  }
  console.log("[api/reviews/import] place_id:", placeId, "limit:", limit, "source:", sourceParam, "forceFullImport:", forceFullImport, "query:", query);

  let rows = [];
  try {
    const client = new Outscraper(apiKey);
    let response;

    if (sourceParam === "tripadvisor") {
      response = await client.tripadvisorReviews([query], limit, false);
    } else if (sourceParam === "trustpilot") {
      response = await client.trustpilotReviews([query], limit, "default", "", null, "", false);
    } else {
      response = await client.googleMapsReviews(
        [query], limit, null, 1, "newest", null, null,
        cutoffTimestamp, null, false, "google", "fr", null, "", false
      );
    }

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
    if (cutoffTimestamp) {
      console.log("[api/reviews/import] Import incrémental depuis le dernier import,", rows.length, "nouveaux avis trouvés.");
    }
    console.log("[api/reviews/import] Nombre d'avis reçus:", rows.length, "| Premier avis brut (debug):", JSON.stringify(rows[0])?.slice(0, 400));
  }
  if (!rows.length) {
    console.log("[api/reviews/import] Aucun avis extrait de la réponse Outscraper.");
    return {
      status: 200,
      data: { success: true, total: 0, inserted: 0, skipped: 0, message: "Aucun avis trouvé pour ce lieu" },
    };
  }

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const source = sourceParam;

  for (const r of rows) {
    const authorName = (r.author_title ?? r.author_name ?? r.autor_name ?? r.reviewer_name ?? r.name ?? "").trim();
    const ratingRaw = r.review_rating ?? r.rating ?? r.stars;
    const rating = typeof ratingRaw === "number" ? Math.min(5, Math.max(1, ratingRaw)) : (parseInt(String(ratingRaw ?? 0), 10) || null);
    const text = (r.review_text ?? r.review ?? r.text ?? r.content ?? "").trim();
    const dateRaw = r.review_datetime_utc ?? r.review_date ?? r.date ?? r.published_at ?? "";
    const publishedAt = dateRaw ? new Date(dateRaw).toISOString().slice(0, 19) : "";

    const identityHash = simpleHash(`${source}|${authorName}|${publishedAt}|${placeId}`);

    const contentHash = simpleHash(`${rating}|${text.toLowerCase().trim().replace(/\s+/g, " ")}`);

    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id, rating, text")
      .eq("user_id", user.id)
      .eq("source_review_id", identityHash)
      .maybeSingle();

    if (existingReview) {
      const existingContentHash = simpleHash(
        `${existingReview.rating}|${(existingReview.text || "").toLowerCase().trim().replace(/\s+/g, " ")}`
      );

      if (existingContentHash === contentHash) {
        skipped++;
      } else {
        const { error: updateError } = await supabase
          .from("reviews")
          .update({ rating, text })
          .eq("id", existingReview.id);

        if (updateError) {
          console.error("[api/reviews/import] Update error:", updateError);
          skipped++;
        } else {
          console.log(`[api/reviews/import] Review updated (id=${existingReview.id}): text or rating changed`);
          updated++;
        }
      }
      continue;
    }

    // New review — insert it with identityHash as the stable source_review_id
    const reviewData = {
      user_id: user.id,
      place_id: placeId,
      source,
      source_review_id: identityHash,
      review_id_ext: identityHash,
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
      console.error("[api/reviews/import] Insert error:", insertError);
      skipped++;
    } else {
      inserted++;
    }
  }

  // Mettre à jour last_reviews_import après un import réussi
  const { error: updateError } = await supabase
    .from("establishments")
    .update({ last_reviews_import: new Date().toISOString() })
    .eq("place_id", placeId)
    .eq("user_id", user.id);
  if (updateError) {
    console.warn("[api/reviews/import] Mise à jour last_reviews_import ignorée:", updateError.message);
  }

  return {
    status: 200,
    data: { success: true, total: rows.length, inserted, updated, skipped },
  };
}
