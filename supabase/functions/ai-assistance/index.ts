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
    
    console.log('Question reçue:', question);
    console.log('EstablishmentContext présent:', !!establishmentContext);
    if (establishmentContext) {
      console.log('Données établissement:', {
        name: establishmentContext.name,
        totalReviews: establishmentContext.totalReviews,
        topIssuesCount: establishmentContext.topIssues?.length || 0,
        topPraisesCount: establishmentContext.topPraises?.length || 0
      });
    }
    
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
        
        systemPrompt = `Tu es un ANALYSTE D'AVIS CLIENTS professionnel. Tu analyses les données réelles de l'établissement "${ctx.name}" pour aider le propriétaire à comprendre et améliorer sa réputation en ligne.

TON RÔLE EXCLUSIF :
Tu es un expert en analyse d'avis clients. Tu analyses les données réelles de "${ctx.name}" fournies ci-dessous et tu réponds à TOUTES les questions sur :
- Les avis clients (contenu, problèmes, points forts, tendances)
- La note moyenne et son évolution
- Les problèmes récurrents dans les avis
- Les conseils pour améliorer l'établissement
- L'impact des avis sur le business

RÈGLE FONDAMENTALE :
Tu réponds TOUJOURS aux questions sur les avis clients. Tu ne refuses JAMAIS une question, même si elle est vague ou simple. Tu utilises TOUJOURS les données réelles ci-dessous pour donner des réponses précises et actionnables.

DONNÉES RÉELLES DE L'ÉTABLISSEMENT "${ctx.name}" :
- Nombre total d'avis : ${ctx.totalReviews}
- Avis positifs (4-5 étoiles) : ${ctx.positiveReviews}
- Avis négatifs (1-2 étoiles) : ${ctx.negativeReviews}
- Note moyenne actuelle : ${ctx.avgRating}/5

PROBLÈMES RÉCURRENTS IDENTIFIÉS (basés sur les vrais avis) :
${ctx.topIssues?.length > 0 ? ctx.topIssues.map((issue: any) => {
  const issueName = typeof issue === 'string' ? issue : issue.theme || issue.issue || issue.name || 'Problème';
  const count = typeof issue === 'object' && issue.count ? ` (${issue.count} mentions)` : '';
  return `- ${issueName}${count}`;
}).join('\n') : 'Aucun problème récurrent identifié pour le moment'}

POINTS FORTS IDENTIFIÉS (basés sur les vrais avis) :
${ctx.topPraises?.length > 0 ? ctx.topPraises.map((praise: any) => {
  const praiseName = typeof praise === 'string' ? praise : praise.theme || praise.strength || praise.name || 'Point fort';
  const count = typeof praise === 'object' && praise.count ? ` (${praise.count} mentions)` : '';
  return `- ${praiseName}${count}`;
}).join('\n') : 'Aucun point fort spécifique identifié'}

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

COMMENT RÉPONDRE :
1. Analyse les données réelles ci-dessous (statistiques, problèmes, points forts, exemples d'avis)
2. Identifie les informations pertinentes pour répondre à la question
3. Donne une réponse précise basée sur les données réelles
4. Cite des exemples concrets tirés des avis quand c'est pertinent
5. Propose des actions concrètes pour améliorer l'établissement
6. Utilise le vouvoiement et un ton professionnel

EXEMPLES DE RÉPONSES ATTENDUES :
- Question : "quel est le problème le plus présent dans mes avis ?"
  → Réponds en identifiant le problème le plus fréquent depuis les données ci-dessous, avec des exemples concrets

- Question : "comment améliorer ma note ?"
  → Réponds en analysant les problèmes identifiés et en proposant des actions concrètes

- Question : "quels sont les points faibles de mon établissement ?"
  → Réponds en listant les problèmes récurrents avec leurs fréquences et des exemples d'avis

IMPORTANT :
- Utilise TOUJOURS les données réelles ci-dessus pour répondre
- Ne refuse JAMAIS une question, même si elle est vague
- Donne des réponses personnalisées basées sur les vrais avis de "${ctx.name}"
- Sois précis, actionnable et basé sur les données réelles`;
      } else {
        // Prompt par défaut sans données d'établissement
        systemPrompt = `Tu es un ANALYSTE D'AVIS CLIENTS professionnel. Tu aides les propriétaires d'établissements à comprendre et améliorer leur réputation en ligne en analysant leurs avis clients.

TON RÔLE :
Tu es un expert en analyse d'avis clients et gestion de réputation en ligne. Tu réponds à TOUTES les questions sur :
- Les avis clients (analyse, contenu, problèmes, points forts, tendances)
- La note moyenne (calcul, évolution, amélioration, facteurs qui l'affectent)
- L'impact des avis sur le business (chiffre d'affaires, pertes de revenus)
- Les problèmes récurrents dans les avis (identification, causes, solutions)
- Les stratégies pour améliorer la réputation en ligne
- Les meilleures pratiques pour répondre aux avis

RÈGLE FONDAMENTALE :
Tu réponds TOUJOURS aux questions sur les avis clients. Tu ne refuses JAMAIS une question, même si elle est vague. Tu donnes des conseils concrets et actionnables basés sur les meilleures pratiques de gestion de réputation.

COMMENT RÉPONDRE :
- Analyse la question de l'utilisateur
- Donne des conseils basés sur les meilleures pratiques de gestion de réputation
- Propose des solutions concrètes et actionnables
- Sois précis, clair et professionnel
- Utilise le vouvoiement

EXEMPLES DE QUESTIONS QUE TU DOIS TOUJOURS ACCEPTER :
- "quel est le problème le plus présent dans mes avis ?" → Donne des conseils sur les problèmes les plus courants
- "comment améliorer ma note ?" → Explique les facteurs qui affectent la note et donne des conseils
- "quels sont les points faibles de mon établissement ?" → Liste les problèmes récurrents typiques
- "comment puis-je obtenir plus d'avis positifs ?" → Donne des stratégies pour encourager les avis positifs
- Toute question sur "mes avis", "mes clients", "ma note", "mes problèmes" → DOIT être acceptée et répondue`;
      }
    }

    // Préparer le message utilisateur avec une instruction explicite
    const userMessage = establishmentContext 
      ? `Analyse les données de l'établissement "${establishmentContext.name}" et réponds à cette question en utilisant les données réelles fournies. Question : ${question}`
      : question;

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
          { role: "user", content: userMessage }
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
    let answer = data.choices?.[0]?.message?.content;

    if (!answer) {
      throw new Error("Réponse vide de l'IA");
    }

    // Filtrer et remplacer les réponses restrictives
    const restrictivePhrases = [
      "Je peux uniquement répondre aux questions concernant Reviewsvisor",
      "je peux uniquement répondre aux questions concernant Reviewsvisor",
      "Je peux uniquement répondre aux questions concernant reviewsvisor",
      "je peux uniquement répondre aux questions concernant reviewsvisor",
      "uniquement répondre aux questions concernant Reviewsvisor",
      "uniquement répondre aux questions concernant reviewsvisor"
    ];

    // Vérifier si la réponse contient une phrase restrictive
    const containsRestrictivePhrase = restrictivePhrases.some(phrase => 
      answer.toLowerCase().includes(phrase.toLowerCase())
    );

    if (containsRestrictivePhrase) {
      console.log("⚠️ Réponse restrictive détectée, remplacement par une réponse d'analyse d'avis");
      
      // Remplacer par une réponse d'analyse d'avis basée sur les données disponibles
      if (establishmentContext) {
        const ctx = establishmentContext;
        const topIssue = ctx.topIssues?.[0];
        const issueName = topIssue ? (typeof topIssue === 'string' ? topIssue : topIssue.theme || topIssue.issue || topIssue.name) : 'les problèmes identifiés';
        
        answer = `D'après l'analyse de vos ${ctx.totalReviews} avis pour "${ctx.name}", je peux vous aider à comprendre vos données clients.

Votre note moyenne actuelle est de ${ctx.avgRating}/5, avec ${ctx.positiveReviews} avis positifs et ${ctx.negativeReviews} avis négatifs.

${topIssue ? `Le problème le plus fréquent dans vos avis concerne : ${issueName}.` : 'Je peux analyser vos avis pour identifier les problèmes récurrents.'}

Pour améliorer votre note et votre réputation, je recommande de vous concentrer sur les problèmes prioritaires identifiés dans vos avis. Vous pouvez voir le détail dans l'onglet Analyse du Dashboard.`;
      } else {
        answer = `Je peux vous aider à analyser vos avis clients et améliorer votre réputation en ligne.

Pour des analyses personnalisées basées sur vos vrais avis, je recommande de :
- Identifier les problèmes récurrents dans vos avis
- Analyser les thèmes les plus fréquents (service, qualité, prix, etc.)
- Mettre en place des actions concrètes pour améliorer votre note moyenne
- Répondre efficacement aux avis négatifs

Posez-moi une question spécifique sur vos avis et je vous donnerai des conseils concrets et actionnables.`;
      }
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
