import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
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

    const { data: userData } = await supabase.auth.getUser(token);

    const user = userData.user;

    if (!user) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();

    const placeId = body.placeId?.trim();
    const name = body.name?.trim();
    const address = body.address?.trim();

    if (!placeId || !name || !address) {
      throw new Error("placeId, name, address required");
    }

    const query = `${name}, ${address}`;

    const twelveMonthsAgo = Math.floor(
      new Date(
        new Date().setFullYear(new Date().getFullYear() - 1)
      ).getTime() / 1000
    );

    const client = new Outscraper(
      Deno.env.get("OUTSCRAPER_API_KEY")!
    );
    
const response = await client.googleMapsReviews(
  [query],
  1300,
  null,
  1,
  "newest",
  null,
  null,
  twelveMonthsAgo,
  null,
  false,
  "google",
  "en",
  null,
  ["reviews_data.review_id"] 
);


const data = Array.isArray(response) ? response : response?.data ?? response;
const rows = data?.[0]?.reviews_data ?? [];

console.log("total reviews---->",rows.length);


return new Response(
  JSON.stringify({
    success: true,
    placeId,
    last12MonthsReviewsCount: rows.length,
  }),
  { headers: { ...corsHeaders, "Content-Type": "application/json" } }
);
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(err.message || err),
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});