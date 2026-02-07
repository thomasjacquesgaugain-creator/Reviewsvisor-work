/**
 * Route API locale pour l'import des avis Google via Outscraper.
 * Body requis : placeId, name, address. La query est "[name], [address], France" (SDK reviews-v3, pas place_id).
 * Header: Authorization: Bearer <supabase_jwt>
 */

import { createClient } from "@supabase/supabase-js";
// @ts-expect-error pas de types
import Outscraper from "outscraper";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;
const OUTSCRAPER_API_KEY = process.env.OUTSCRAPER_API_KEY;

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
  date?: string;
  [key: string]: unknown;
}

export async function POST(request: Request) {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error("[api/reviews/import] Supabase not configured:", {
        hasUrl: !!SUPABASE_URL,
        hasKey: !!SUPABASE_ANON_KEY,
      });
      return Response.json(
        { error: "Supabase not configured", hint: "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env" },
        { status: 500 }
      );
    }
    if (!OUTSCRAPER_API_KEY) {
      console.error("[api/reviews/import] OUTSCRAPER_API_KEY missing");
      return Response.json(
        { error: "Outscraper API key not configured", hint: "OUTSCRAPER_API_KEY in .env" },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { placeId?: string; limit?: number; name?: string; address?: string };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const placeId = body.placeId?.trim();
    const limit = typeof body.limit === "number" ? Math.min(Math.max(1, body.limit), 3000) : 2000;
    if (!placeId) {
      return Response.json({ error: "placeId is required" }, { status: 400 });
    }

    const name = (body.name != null && String(body.name).trim()) ? String(body.name).trim() : "";
    const address = (body.address != null && String(body.address).trim()) ? String(body.address).trim() : "";
    if (!name || !address) {
      return Response.json({ error: "name and address are required" }, { status: 400 });
    }

    const query = `${name}, ${address}, France`;
    console.log("[api/reviews/import route] place_id:", placeId, "query:", query);

    const client = new Outscraper(OUTSCRAPER_API_KEY!);
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
    console.log("[api/reviews/import route] Réponse brute Outscraper:", response);

    if (response?.error || response?.errorMessage) {
      return Response.json(
        { error: "Outscraper API error", details: response.error || response.errorMessage },
        { status: 502 }
      );
    }

    const data = Array.isArray(response) ? response : response?.data ?? response;
    let rows: OutscraperReviewRow[] = [];
    if (Array.isArray(data) && data.length > 0) {
      const first = data[0] as { reviews_data?: OutscraperReviewRow[] } | OutscraperReviewRow[];
      if (first && typeof first === "object" && "reviews_data" in first && Array.isArray((first as any).reviews_data)) {
        rows = (first as any).reviews_data;
      } else if (Array.isArray(first)) {
        rows = first as OutscraperReviewRow[];
      } else {
        rows = data as OutscraperReviewRow[];
      }
    }

    if (!rows.length) {
      return Response.json({
        success: true,
        total: 0,
        inserted: 0,
        skipped: 0,
        message: "Aucun avis trouvé pour ce lieu",
      });
    }

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

    if (rows.length) {
      console.log("[api/reviews/import route] Nombre d'avis:", rows.length, "| Premier avis (debug):", JSON.stringify(rows[0])?.slice(0, 400));
    }
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
          console.error("[api/reviews/import] Insert error:", insertError);
        }
        continue;
      }
      inserted++;
      existingSet.add(dedupKey);
    }

    return Response.json({
      success: true,
      total: rows.length,
      inserted,
      skipped,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[api/reviews/import] Exception:", message, err);
    return Response.json({ error: "Internal server error", message }, { status: 500 });
  }
}
