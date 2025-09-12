import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!, 
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;

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

    console.log(`Analyzing reviews for user: ${user.id}`);

    // Etablissement
    const { data: ue } = await supabase
      .from("user_establishment")
      .select("place_id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (!ue?.place_id) {
      console.log("No establishment found for user");
      return new Response(JSON.stringify({ ok: true, analyzed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Fetching reviews for place_id: ${ue.place_id}`);

    // Récupérer les derniers avis (ex. 300 max)
    const { data: revs } = await supabase
      .from("reviews")
      .select("rating,text,language,published_at,source")
      .eq("user_id", user.id)
      .eq("place_id", ue.place_id)
      .order("published_at", { ascending: false })
      .limit(300);

    const docs = (revs ?? []).filter(r => r?.text?.trim());
    console.log(`Found ${docs.length} reviews with text content`);
    
    if (!docs.length) {
      return new Response(JSON.stringify({ ok: true, analyzed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Pré-agrégations simples
    const avg = docs.reduce((s, r) => s + (Number(r.rating) || 0), 0) / docs.length;
    const positives = docs.filter(r => Number(r.rating) >= 4).length;
    const positiveRatio = docs.length ? positives / docs.length : 0;

    console.log(`Stats: avg=${avg.toFixed(2)}, positive_ratio=${positiveRatio.toFixed(3)}`);

    // Appel LLM (résumé structuré)
    const prompt = `
Tu es un analyste de satisfaction client. À partir d'avis bruts de restaurant/bar, produis un JSON concis :

{
  "top_praises":[{"theme":"service","examples":["..."],"count":n}, ...],
  "top_issues":[{"theme":"prix","examples":["..."],"count":n}, ...],
  "themes_summary":"paragraphe de synthèse (max 120 mots)"
}

Contraintes:
- regroupe par thèmes (service, ambiance, qualité, prix, rapidité, propreté, musique, terrasse, cocktails, etc.)
- extrais 2-3 exemples courts par thème.
- réponds UNIQUEMENT en JSON valide.
Avis:
${docs.map(d => `- (${d.source} ${d.published_at}) [${d.rating}/5] ${d.text.replace(/\s+/g,' ').slice(0,400)}`).join("\n")}
`;

    console.log("Calling OpenAI for analysis...");
    
    const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${OPENAI_API_KEY}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07", // Updated to newer model
        max_completion_tokens: 2000, // Use max_completion_tokens for newer models
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!llmRes.ok) {
      const errorText = await llmRes.text();
      console.error("OpenAI API error:", llmRes.status, errorText);
      throw new Error(`OpenAI API error: ${llmRes.status} - ${errorText}`);
    }

    const llmData = await llmRes.json();
    console.log("OpenAI response received");

    let parsed = null;
    try { 
      const content = llmData.choices?.[0]?.message?.content ?? "{}";
      parsed = JSON.parse(content);
      console.log("Successfully parsed AI response");
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
    }

    const payload = {
      user_id: user.id,
      place_id: ue.place_id,
      total_count: docs.length,
      avg_rating: Number(avg.toFixed(2)),
      positive_ratio: Number(positiveRatio.toFixed(3)),
      top_praises: parsed?.top_praises ?? [],
      top_issues: parsed?.top_issues ?? [],
      themes: { summary: parsed?.themes_summary ?? "" },
      updated_at: new Date().toISOString()
    };

    console.log("Saving insights to database...");
    const { error } = await supabase.from("review_insights").upsert(payload);
    if (error) {
      console.error("Database upsert error:", error);
      throw error;
    }

    console.log(`Successfully analyzed ${docs.length} reviews`);
    
    return new Response(JSON.stringify({ ok: true, analyzed: docs.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    console.error("Error in analyze-reviews:", e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});