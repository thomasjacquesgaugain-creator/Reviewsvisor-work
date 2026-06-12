import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

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
  const supabase = createClient(
    Deno.env.get("SB_URL")!,
    Deno.env.get("SB_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  let taskId: string | null = null;

  try {
    const payload = await req.json();
    taskId = payload.id;
    const { status, results_location } = payload;

    if (status !== "SUCCESS") {
      await supabase
        .from("import_jobs")
        .update({
          status: "error",
          error: `Outscraper task status: ${status}`,
          updated_at: new Date().toISOString(),
        })
        .eq("outscraper_task_id", taskId);
      await new Promise((r) => setTimeout(r, 3000));
      await supabase.from("import_jobs").delete().eq("outscraper_task_id", taskId);
      return new Response("ok");
    }

    // Fetch actual review data from results_location
    const resultsRes = await fetch(results_location, {
      headers: {
        "X-API-KEY": Deno.env.get("OUTSCRAPER_API_KEY")!,
      },
    });

    const resultsJson = await resultsRes.json();
 
    // Find the matching job
    const { data: job, error: jobError } = await supabase
      .from("import_jobs")
      .select("id, user_id, place_id, source")
      .eq("outscraper_task_id", taskId)
      .single();

    if (!job) {
      return new Response("job not found", { status: 404 });
    }

    // Extract rows from the results
    const data = resultsJson.data ?? resultsJson;

    const rows =
      data?.[0]?.reviews_data ??
      (Array.isArray(data?.[0]) ? data[0] : data) ??
      [];

    if (!rows.length) {
      await supabase
        .from("import_jobs")
        .update({
          status: "done",
          total: 0,
          inserted: 0,
          updated: 0,
          skipped: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      await new Promise((r) => setTimeout(r, 3000));
      await supabase.from("import_jobs").delete().eq("id", job.id);
      return new Response("ok");
    }

    // Upsert logic
    const reviewMeta = rows.map((r: any) => {
      const author = (r.author_title || r.author_name || "").trim();
      const rating = r.review_rating ?? r.rating ?? null;
      const text = (r.review_text || "").trim();
      const dateRaw = r.review_datetime_utc || r.review_date || "";
      const identityHash = simpleHash(
        `${job.source}|${author}|${dateRaw}|${job.place_id}`,
      );
      const contentHash = simpleHash(`${rating}|${text.toLowerCase().trim()}`);
      return { raw: r, author, rating, text, dateRaw, identityHash, contentHash };
    });

    const { data: existingReviews } = await supabase
      .from("reviews")
      .select("id, source_review_id, rating, text")
      .eq("user_id", job.user_id)
      .eq("place_id", job.place_id);

    const existingMap = new Map(
      (existingReviews || []).map((r: any) => [r.source_review_id, r]),
    );

    const insertRows: any[] = [];
    const updateRows: any[] = [];
    let skipped = 0;

    for (const review of reviewMeta) {
      const existing = existingMap.get(review.identityHash);
      if (!existing) {
        insertRows.push({
          user_id: job.user_id,
          place_id: job.place_id,
          source: job.source,
          source_review_id: review.identityHash,
          author_name: review.author,
          rating: review.rating,
          text: review.text,
          published_at: review.dateRaw,
          raw: review.raw,
        });
        continue;
      }
      const existingHash = simpleHash(
        `${existing.rating}|${(existing.text || "").toLowerCase().trim()}`,
      );
      if (existingHash === review.contentHash) {
        skipped++;
        continue;
      }
      updateRows.push({
        id: existing.id,
        rating: review.rating,
        text: review.text,
      });
    }

    let inserted = 0;
    const BATCH_SIZE = 500;
    for (let i = 0; i < insertRows.length; i += BATCH_SIZE) {
      const batch = insertRows.slice(i, i + BATCH_SIZE);
      const { data: upserted, error } = await supabase
        .from("reviews")
        .upsert(batch, {
          onConflict: "user_id,place_id,source,source_review_id",
          ignoreDuplicates: true,
        })
        .select("id");

      if (error) throw error;
      inserted += upserted?.length ?? 0;
    }

    let updated = 0;
    for (let i = 0; i < updateRows.length; i += 100) {
      const batch = updateRows.slice(i, i + 100);
      await Promise.all(
        batch.map((r: any) =>
          supabase
            .from("reviews")
            .update({ rating: r.rating, text: r.text })
            .eq("id", r.id),
        ),
      );
      updated += batch.length;
    }

    await supabase
      .from("establishments")
      .update({ last_reviews_import: new Date().toISOString() })
      .eq("place_id", job.place_id)
      .eq("user_id", job.user_id);

    // This update triggers Realtime → frontend gets notified instantly
    const {error:updateError}=await supabase
      .from("import_jobs")
      .update({
        status: "done",
        total: rows.length,
        inserted,
        updated,
        skipped,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    // Wait for Realtime to fire before deleting
    await new Promise((resolve) => setTimeout(resolve, 3000));
    await supabase.from("import_jobs").delete().eq("id", job.id);

    return new Response("ok");

  } catch (err: any) {

    // Update job to error status so Realtime notifies the frontend
    if (taskId) {
      await supabase
        .from("import_jobs")
        .update({
          status: "error",
          error: String(err?.message || err),
          updated_at: new Date().toISOString(),
        })
        .eq("outscraper_task_id", taskId);

      // Wait for Realtime to fire before deleting
      await new Promise((r) => setTimeout(r, 3000));
      await supabase.from("import_jobs").delete().eq("outscraper_task_id", taskId);
    }

    return new Response("error", { status: 500 });
  }
});