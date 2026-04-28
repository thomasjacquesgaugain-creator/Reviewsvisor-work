import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Outscraper from "https://esm.sh/outscraper";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function simpleHash(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Unauthorized");

    const body = await req.json();

    const placeId = body.placeId?.trim();
    const name = body.name?.trim();
    const address = body.address?.trim();
    const limit = Math.min(Math.max(body.limit || 2000, 1), 3000);
    const sourceParam = body.source || "google";
    const forceFullImport = !!body.forceFullImport;

    if (!placeId || !name || !address) {
      throw new Error("placeId, name, address required");
    }

    const query = `${name}, ${address}`;

    // 🔹 Incremental import logic
    let cutoffTimestamp: number | null = null;

    if (sourceParam === "google" && !forceFullImport) {
      const { data: etab } = await supabase
        .from("establishments")
        .select("last_reviews_import")
        .eq("place_id", placeId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (etab?.last_reviews_import) {
        const last = new Date(etab.last_reviews_import);
        cutoffTimestamp = Math.floor(
          (last.getTime() - 24 * 60 * 60 * 1000) / 1000
        );
      }
    }

    // 🔹 Outscraper SDK
    const client = new Outscraper(Deno.env.get("OUTSCRAPER_API_KEY")!);

    let response: any;

    if (sourceParam === "tripadvisor") {
      response = await client.tripadvisorReviews([query], limit, false);
    } else if (sourceParam === "trustpilot") {
      response = await client.trustpilotReviews(
        [query],
        limit,
        "default",
        "",
        null,
        "",
        false
      );
    } else {
      response = await client.googleMapsReviews(
        [query],
        limit,
        null,
        1,
        "newest",
        null,
        null,
        cutoffTimestamp,
        null,
        false,
        "google",
        "fr"
      );
    }

    const data = Array.isArray(response) ? response : response?.data ?? response;
    const rows =
      data?.[0]?.reviews_data ??
      (Array.isArray(data?.[0]) ? data[0] : data) ??
      [];

      console.log("response----->",rows.length);
      

    if (!rows.length) {
      return new Response(
        JSON.stringify({
          success: true,
          total: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
        }),
        { headers: corsHeaders }
      );
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const r of rows) {
      const author = (
        r.author_title ||
        r.author_name ||
        ""
      ).trim();

      const rating = r.review_rating ?? r.rating ?? null;
      const text = (r.review_text || "").trim();
      const dateRaw = r.review_datetime_utc || r.review_date || "";

      const identityHash = simpleHash(
        `${sourceParam}|${author}|${dateRaw}|${placeId}`
      );

      const contentHash = simpleHash(
        `${rating}|${text.toLowerCase().trim()}`
      );

      const { data: existing } = await supabase
        .from("reviews")
        .select("id, rating, text")
        .eq("user_id", user.id)
        .eq("source_review_id", identityHash)
        .maybeSingle();

      if (existing) {
        const existingHash = simpleHash(
          `${existing.rating}|${(existing.text || "")
            .toLowerCase()
            .trim()}`
        );

        if (existingHash === contentHash) {
          skipped++;
        } else {
          await supabase
            .from("reviews")
            .update({ rating, text })
            .eq("id", existing.id);
          updated++;
        }
        continue;
      }

      await supabase.from("reviews").insert({
        user_id: user.id,
        place_id: placeId,
        source: sourceParam,
        source_review_id: identityHash,
        author_name: author,
        rating,
        text,
        published_at: dateRaw,
        raw: r,
      });

      inserted++;
    }

    await supabase
      .from("establishments")
      .update({ last_reviews_import: new Date().toISOString() })
      .eq("place_id", placeId)
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        success: true,
        total: rows.length,
        inserted,
        updated,
        skipped,
      }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err.message || err) }),
      { status: 400, headers: corsHeaders }
    );
  }
});