import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import Outscraper from "https://esm.sh/outscraper";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SB_URL")!,
      Deno.env.get("SB_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const { data: userData } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData.user) throw new Error("Unauthorized");
    const user = userData.user;

    const { placeId, name, address, limit = 2000, source = "google", forceFullImport = false } = await req.json();
    if (!placeId || !name || !address) throw new Error("placeId, name, address required");
    const { data: job, error: jobErr } = await supabase
      .from("import_jobs")
      .insert({ user_id: user.id, place_id: placeId, status: "pending",source: source??"google" })
      .select("id")
      .single();
    if (jobErr) throw jobErr;

    const query = `${name}, ${address}`;

    let cutoffTimestamp: number | null = null;
    if (source === "google" && !forceFullImport) {
      const { data: etab } = await supabase
        .from("establishments")
        .select("last_reviews_import")
        .eq("place_id", placeId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (etab?.last_reviews_import) {
        const last = new Date(etab.last_reviews_import);
        cutoffTimestamp = Math.floor((last.getTime() - 86400000) / 1000);
      }
    }

    const webhookUrl = `${Deno.env.get("SB_URL")}/functions/v1/outscraper-webhook`;

const params = new URLSearchParams({
  query,
  reviewsLimit: String(limit),
  limit: "1",
  sort: "newest",
  source: "google",
  async: "true",
  webhook: webhookUrl,
  ...(cutoffTimestamp && { cutoff: String(cutoffTimestamp) }),
});

const res = await fetch(
  `https://api.app.outscraper.com/maps/reviews-v3?${params.toString()}`,
  {
    method: "GET",
    headers: {
      "X-API-KEY": Deno.env.get("OUTSCRAPER_API_KEY")!,
    },
  }
);

const task = await res.json();

if (!task.id) throw new Error(`Outscraper error: ${JSON.stringify(task)}`);


    await supabase
      .from("import_jobs")
      .update({ outscraper_task_id: task.id, status: "running" })
      .eq("id", job.id);

    return new Response(
      JSON.stringify({ success: true, jobId: job.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err.message || err) }),
      { status: 400, headers: corsHeaders }
    );
  }
});