import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { etablissementId } = await req.json();
    
    if (!etablissementId) {
      return new Response(
        JSON.stringify({ error: "etablissementId manquant" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get reviews for the establishment
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('*')
      .eq('place_id', etablissementId);

    if (reviewsError) {
      throw new Error(`Error fetching reviews: ${reviewsError.message}`);
    }

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ empty: true, message: "Aucun avis à analyser." }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Transform reviews for AI analysis
    const avis = reviews.map(review => ({
      id: review.id.toString(),
      etablissementId: review.place_id,
      source: review.source || "autre",
      note: Number(review.rating) || 0,
      texte: review.text || '',
      date: review.published_at || review.inserted_at
    }));

    // Prepare AI prompt
    const prompt = [
      "Tu es un analyste d'avis clients pour la restauration.",
      "Analyse les avis fournis (français) et RENVOIE un JSON STRICT conforme au schéma ci-dessous.",
      "Consignes :",
      "- Calcule un sentiment global (label + score 0..1).",
      "- Dégage 3 à 7 thèmes avec score 0..1 et 1–3 verbatims textuels courts.",
      "- Donne Top 3 éloges et Top 3 irritants.",
      "- Propose des recommandations actionnables et priorisées.",
      "- Décris les tendances récentes si visibles.",
      "Schéma JSON attendu:",
      `{
        "resume": "string",
        "sentimentGlobal": { "score": 0.8, "label": "Positif" },
        "stats": { "totalAvis": 0, "moyenne": 0, "positifsPct": 0, "negatifsPct": 0, "periode": { "from": "2024-01-01", "to": "2024-12-31" } },
        "themes": [ { "theme": "Service", "score": 0.8, "verbatims": ["Excellent service"] } ],
        "elogesTop3": ["Point positif 1", "Point positif 2", "Point positif 3"],
        "irritantsTop3": ["Point négatif 1", "Point négatif 2", "Point négatif 3"],
        "recommandations": ["Recommandation 1", "Recommandation 2"],
        "tendances": "Description des tendances"
      }`,
      "Voici les avis (JSON):",
      JSON.stringify(avis)
    ].join("\n");

    // Call OpenAI API
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices[0]?.message?.content || "{}";
    const aiJson = JSON.parse(content);

    const now = new Date().toISOString();
    const analyseId = crypto.randomUUID();

    const analyse = {
      id: analyseId,
      etablissementId,
      createdAt: now,
      ...aiJson
    };

    // Store analysis in Supabase
    const { error: insertError } = await supabase
      .from('review_insights')
      .upsert({
        place_id: etablissementId,
        user_id: null, // Will be set by RLS
        summary: analyse,
        last_analyzed_at: now,
        total_count: avis.length,
        avg_rating: avis.reduce((sum, a) => sum + a.note, 0) / avis.length
      });

    if (insertError) {
      console.error('Error storing analysis:', insertError);
    }

    return new Response(
      JSON.stringify({ analyse }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in analyze-establishment function:', error);
    return new Response(
      JSON.stringify({ error: error.message || "Erreur serveur analyse" }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});