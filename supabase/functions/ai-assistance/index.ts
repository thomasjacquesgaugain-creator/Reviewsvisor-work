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

    const { question, systemPrompt: customSystemPrompt, establishmentContext } = await req.json();
    
    if (!question) {
      throw new Error("Question manquante");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY non configurée");
    }

    // Construire le prompt système avec les données de l'établissement si disponibles
    let systemPrompt = customSystemPrompt;
    
    if (!systemPrompt) {
      if (establishmentContext) {
        // Prompt personnalisé avec les données réelles de l'établissement
        const ctx = establishmentContext;
        const negativeExamples = ctx.recentNegativeReviews?.slice(0, 3).map((r: any) => 
          `- ${r.rating}/5 étoiles : "${r.text.substring(0, 150)}${r.text.length > 150 ? '...' : ''}"`
        ).join('\n') || 'Aucun avis négatif récent';
        
        const positiveExamples = ctx.recentPositiveReviews?.slice(0, 2).map((r: any) => 
          `- ${r.rating}/5 étoiles : "${r.text.substring(0, 150)}${r.text.length > 150 ? '...' : ''}"`
        ).join('\n') || 'Aucun avis positif récent';
        
        systemPrompt = `Tu es l'assistant Reviewsvisor, un expert en analyse d'avis clients. Tu analyses les VRAIES données de l'établissement "${ctx.name}" pour donner des réponses personnalisées et précises.

DONNÉES RÉELLES DE L'ÉTABLISSEMENT "${ctx.name}" :
- Nombre total d'avis : ${ctx.totalReviews}
- Avis positifs (4-5 étoiles) : ${ctx.positiveReviews}
- Avis négatifs (1-2 étoiles) : ${ctx.negativeReviews}
- Note moyenne actuelle : ${ctx.avgRating}/5

PROBLÈMES RÉCURRENTS IDENTIFIÉS (basés sur les vrais avis) :
${ctx.topIssues?.length > 0 ? ctx.topIssues.map((issue: string) => `- ${issue}`).join('\n') : 'Aucun problème récurrent identifié pour le moment'}

POINTS FORTS IDENTIFIÉS (basés sur les vrais avis) :
${ctx.topPraises?.length > 0 ? ctx.topPraises.map((praise: string) => `- ${praise}`).join('\n') : 'Aucun point fort spécifique identifié'}

THÈMES PRINCIPAUX DANS LES AVIS :
${ctx.themes?.length > 0 ? ctx.themes.map((theme: any) => {
  const themeName = typeof theme === 'string' ? theme : theme.name || theme.theme || 'Thème';
  const percentage = typeof theme === 'object' && theme.percentage ? ` (${theme.percentage}%)` : '';
  return `- ${themeName}${percentage}`;
}).join('\n') : 'Aucun thème spécifique identifié'}

EXEMPLES D'AVIS NÉGATIFS RÉCENTS :
${negativeExamples}

EXEMPLES D'AVIS POSITIFS RÉCENTS :
${positiveExamples}

TON RÔLE :
- Analyser les VRAIES données ci-dessus pour répondre aux questions
- Donner des réponses PERSONNALISÉES basées sur les avis réels de "${ctx.name}"
- Citer des exemples concrets tirés des données réelles
- Identifier les problèmes prioritaires basés sur les thèmes récurrents
- Proposer des solutions concrètes adaptées à cet établissement

QUAND TU RÉPONDS :
- Utilise les données réelles ci-dessus (statistiques, thèmes, exemples d'avis)
- Cite des exemples concrets tirés des avis récents
- Indique où trouver plus de détails : "Vous pouvez voir le détail dans l'onglet Analyse du Dashboard" ou "Consultez la section Recommandations pour les solutions" ou "Allez dans Établissement > Visuel des avis pour voir tous les commentaires"
- Sois précis, actionnable et basé sur les données réelles
- Utilise le vouvoiement
- Ne donne PAS de réponses génériques sur Reviewsvisor, mais des analyses personnalisées basées sur les vrais avis`;
      } else {
        // Prompt par défaut sans données d'établissement
        systemPrompt = `Tu es l'assistant Reviewsvisor, un expert en analyse d'avis clients, gestion de réputation en ligne et amélioration de la performance des établissements.

TON RÔLE : Répondre à TOUTES les questions liées aux avis clients, à la réputation, aux notes, aux performances et à l'amélioration d'un établissement.

TU RÉPONDS SANS RESTRICTION À TOUTES LES QUESTIONS SUR :
- Les avis clients (positifs, négatifs, neutres, leur contenu, leur analyse, leur impact)
- La note moyenne (calcul, évolution, amélioration, facteurs qui l'affectent, impact sur le business)
- Le chiffre d'affaires (impact des avis, corrélation avec les notes, pertes de revenus)
- Les clients (satisfaction, plaintes, retours, comportement, fidélité)
- Les problèmes (récurrents, prioritaires, à résoudre, causes, solutions)
- La réputation en ligne (image, perception, gestion, amélioration)
- Les performances de l'établissement (basées sur les avis, métriques, tendances)
- Les recommandations (pour s'améliorer, actions à prendre, stratégies, priorités)
- Les éléments qui affectent la note ou les avis (service, qualité, prix, etc.)
- L'analyse des avis et des tendances (patterns, insights, opportunités)
- Les réponses aux avis et leur gestion (stratégies, meilleures pratiques)
- Les fonctionnalités de Reviewsvisor (comment utiliser l'outil)

IMPORTANT : 
- Réponds TOUJOURS aux questions sur les avis, notes, clients, réputation, chiffre d'affaires
- Ne refuse JAMAIS une question liée aux avis ou à la gestion d'établissement
- Sois utile, concis, clair et professionnel
- Utilise le vouvoiement
- Fournis des réponses actionnables et basées sur les données quand possible`;
      }
    }

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
