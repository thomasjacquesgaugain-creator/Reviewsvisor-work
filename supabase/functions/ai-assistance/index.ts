import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { question } = await req.json();
    
    if (!question) {
      throw new Error("Question manquante");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    const systemPrompt = `Tu es l'assistant officiel de Reviewsvisor, une application d'analyse d'avis clients.

Tu es l'assistant Reviewsvisor. Tu réponds UNIQUEMENT aux questions concernant les avis clients, la gestion de la réputation en ligne, et l'utilisation de Reviewsvisor. Si on te pose une question hors sujet, rappelle poliment ton rôle.

RÈGLES STRICTES :
- Tu ne dois répondre QU'AUX questions liées aux avis clients, à l'e-réputation, et à l'utilisation de Reviewsvisor
- Si la question est hors sujet, rappelle poliment ton rôle et invite l'utilisateur à poser une question sur ses avis clients
- Sois concis, clair et professionnel
- Utilise le vouvoiement

FONCTIONNALITÉS DE REVIEWSVISOR :
- Analyse d'avis clients avec IA
- Centralisation des avis (Google, Facebook, TripAdvisor, TheFork, Yelp)
- Import manuel (CSV, collage direct)
- Détection automatique des points forts et faibles
- Rapports et statistiques en temps réel
- Suggestions d'amélioration personnalisées`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants, veuillez contacter le support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Erreur AI Gateway:", response.status, errorText);
      throw new Error("Erreur lors de l'appel à l'IA");
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("Réponse vide de l'IA");
    }

    return new Response(
      JSON.stringify({ answer }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erreur dans ai-assistance:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erreur inconnue" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
