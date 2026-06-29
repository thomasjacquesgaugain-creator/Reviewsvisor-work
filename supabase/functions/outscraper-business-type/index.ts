import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Outscraper from "https://esm.sh/outscraper";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


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
if (!authHeader) {
  throw new Error("Unauthorized");
}

const token = authHeader.replace("Bearer ", "");

// Allow server-to-server calls using the service role key (e.g. from stripe-webhook)
const isServiceRoleCall = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!isServiceRoleCall) {
  const { data: userData } = await supabase.auth.getUser(token);
  if (!userData.user) {
    throw new Error("Unauthorized");
  }
}

    const body = await req.json();
    const placeId = body.placeId?.trim();
    const name = body.name?.trim();
    const address = body.address?.trim();

    if (!placeId || !name || !address) {
      throw new Error("placeId, name, address required");
    }

    const query = `${name}, ${address}`;
    const client = new Outscraper(Deno.env.get("OUTSCRAPER_API_KEY")!);

    // Fire both language requests concurrently — same total work, no added latency
    const [frResponse, enResponse] = await Promise.all([
      client.googleMapsReviews(
        [query], 1, null, 1, "newest", null, null,
        null, null, false, "google", "fr", null,
        ["type", "subtypes", "category"]
      ),
      client.googleMapsReviews(
        [query], 1, null, 1, "newest", null, null,
        null, null, false, "google", "en", null,
        ["type", "subtypes", "category"]
      ),
    ]);

    const frData = Array.isArray(frResponse) ? frResponse : frResponse?.data ?? frResponse;
    const enData = Array.isArray(enResponse) ? enResponse : enResponse?.data ?? enResponse;

    const frResult = frData?.[0];
    const enResult = enData?.[0];

    console.log("RAW frResult ---->", JSON.stringify(frResult));
    console.log("RAW enResult ---->", JSON.stringify(enResult));

    return new Response(
      JSON.stringify({
        success: true,
        placeId,
        types: {
          fr: frResult?.type ?? null,
          en: enResult?.type ?? null,
        },
        subtypes: {
          fr: frResult?.subtypes ?? null,
          en: enResult?.subtypes ?? null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(err?.message || err),
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});