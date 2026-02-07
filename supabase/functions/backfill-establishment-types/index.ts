import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapGoogleTypeToCategory(types: string[]): string {
  if (!types || !Array.isArray(types)) return "Autre";
  const lower = types.map((t) => String(t).toLowerCase());
  for (const t of lower) {
    if (t === "restaurant" || t === "food") return "Restaurant";
    if (t === "bar" || t === "night_club") return "Bar";
    if (t === "cafe") return "Café";
    if (t === "beauty_salon" || t === "hair_care" || t === "hairdresser" || t === "hair_salon") return "Salon de coiffure";
    if (t === "spa" || t === "health") return "Spa / Bien-être";
    if (t === "lodging" || t === "hotel") return "Hôtel";
    if (t === "bakery") return "Boulangerie";
    if (t === "store" || t === "shopping_mall" || t === "clothing_store") return "Commerce de détail";
  }
  return "Autre";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const apiKey = Deno.env.get("CLE_API_GOOGLE_MAPS");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "CLE_API_GOOGLE_MAPS not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: rows, error: fetchError } = await supabaseAdmin
      .from("établissements")
      .select("id, place_id")
      .is("type_etablissement", null);

    if (fetchError) {
      console.error("Error fetching establishments:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const toUpdate = (rows ?? []).filter((r) => r.place_id);
    const results: { id: string; place_id: string; type_etablissement: string; status: string }[] = [];
    let updated = 0;
    let failed = 0;

    for (const row of toUpdate) {
      try {
        const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
        url.searchParams.set("place_id", row.place_id);
        url.searchParams.set("fields", "types");
        url.searchParams.set("key", apiKey);

        const res = await fetch(url.toString());
        const data = await res.json();

        if (data.status !== "OK" || !data.result) {
          results.push({
            id: row.id,
            place_id: row.place_id,
            type_etablissement: "Autre",
            status: data.status || "NO_RESULT",
          });
          failed++;
          continue;
        }

        const types: string[] = data.result.types ?? [];
        const typeEtablissement = mapGoogleTypeToCategory(types);

        const { error: updateError } = await supabaseAdmin
          .from("établissements")
          .update({ type_etablissement: typeEtablissement })
          .eq("id", row.id);

        if (updateError) {
          console.error("Update error for", row.id, updateError);
          results.push({ id: row.id, place_id: row.place_id, type_etablissement, status: "UPDATE_ERROR" });
          failed++;
        } else {
          results.push({ id: row.id, place_id: row.place_id, type_etablissement, status: "updated" });
          updated++;
        }
      } catch (err) {
        console.error("Error processing", row.id, err);
        results.push({
          id: row.id,
          place_id: row.place_id,
          type_etablissement: "Autre",
          status: "ERROR",
        });
        failed++;
      }
    }

    return new Response(
      JSON.stringify({
        total: toUpdate.length,
        updated,
        failed,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Backfill error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
