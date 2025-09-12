import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY")!;

const supabase = createClient(supabaseUrl, serviceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userResp = await supabase.auth.getUser(auth.replace("Bearer ", ""));
    const user = userResp.data.user;
    if (!user) {
      return new Response("Unauthorized", { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    console.log(`Syncing reviews for user: ${user.id}`);

    // 1) récupérer l'établissement lié
    const { data: ue } = await supabase
      .from("user_establishment")
      .select("place_id, name")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (!ue?.place_id) {
      console.log("No establishment found for user");
      return new Response(JSON.stringify({ ok: true, inserted: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Fetching reviews for place_id: ${ue.place_id}`);

    // 2) appeler Google Place Details (5 avis)
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", ue.place_id);
    url.searchParams.set("fields", "reviews,user_ratings_total,rating,url,website,name,formatted_address");
    url.searchParams.set("reviews_no_translations", "true");
    url.searchParams.set("reviews_sort", "newest");
    url.searchParams.set("key", GOOGLE_API_KEY);

    const g = await fetch(url).then(r => r.json());
    
    if (g.status !== 'OK') {
      console.error("Google API error:", g.status, g.error_message);
      throw new Error(`Google API error: ${g.status} - ${g.error_message}`);
    }

    const reviews: any[] = g?.result?.reviews ?? [];
    console.log(`Found ${reviews.length} reviews from Google`);

    // 3) normaliser et upsert
    const rows = reviews.map(r => {
      const sid = `${r.author_url || r.author_name}-${r.time}`;
      return {
        user_id: user.id,
        place_id: ue.place_id,
        source: "google",
        source_review_id: sid,
        author: r.author_name,
        rating: r.rating,
        language: r.language,
        text: r.text,
        published_at: r.time ? new Date(r.time * 1000).toISOString() : null,
        url: r.author_url || g?.result?.url || null,
        raw: r
      };
    });

    if (rows.length) {
      const { error } = await supabase
        .from("reviews")
        .upsert(rows, { onConflict: "user_id,place_id,source,source_review_id" });
      
      if (error) {
        console.error("Database upsert error:", error);
        throw error;
      }
      
      console.log(`Successfully upserted ${rows.length} reviews`);
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      inserted: rows.length, 
      total_google: g?.result?.user_ratings_total ?? null 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error("Error in sync-google-reviews:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});