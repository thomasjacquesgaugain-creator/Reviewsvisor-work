import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const establishmentId = url.searchParams.get('establishmentId');
    const userId = url.searchParams.get('userId');
    
    if (!establishmentId || !userId) {
      return new Response(
        JSON.stringify({ error: "establishmentId et userId requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get total count
    const { count: total, error: countError } = await supabaseAdmin
      .from("reviews")
      .select("id", { head: true, count: "exact" })
      .eq("place_id", establishmentId)
      .eq("user_id", userId);

    if (countError) {
      console.error("Count error:", countError);
      throw countError;
    }

    // Get ratings for average calculation
    const { data: ratings, error: ratingsError } = await supabaseAdmin
      .from("reviews")
      .select("rating")
      .eq("place_id", establishmentId)
      .eq("user_id", userId)
      .limit(10000);

    if (ratingsError) {
      console.error("Ratings error:", ratingsError);
      throw ratingsError;
    }

    let avg = null as number | null;
    if (ratings?.length) {
      const sum = ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0);
      avg = Math.round((sum / ratings.length) * 10) / 10;
    }

    const result = { totalAll: total ?? 0, avgRating: avg };
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0, must-revalidate"
        } 
      }
    );

  } catch (error: any) {
    console.error("Summary error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});