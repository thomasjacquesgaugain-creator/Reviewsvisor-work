import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[generate-review-response] ========== DÉBUT ==========');
    
    // STEP 1: Validate authentication (même méthode que ai-assistance qui fonctionne)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[generate-review-response] Missing Authorization header');
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
      console.error('[generate-review-response] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-review-response] Authenticated user:', user.id);
    
    // STEP 2: Get and validate request data
    const { review, establishment } = await req.json();
    console.log('[generate-review-response] Données reçues:', { 
      reviewText: review?.text?.substring(0, 50),
      rating: review?.rating,
      establishmentName: establishment?.name
    });

    if (!review || !establishment) {
      return new Response(
        JSON.stringify({ error: 'Données manquantes (review ou establishment)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 3: Validate input data
    if (!review.text || !review.rating || !establishment.name) {
      return new Response(
        JSON.stringify({ error: 'Invalid request data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit text length to prevent abuse
    if (review.text.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Review text too long' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 4: Verify ownership if user_id is provided
    if (review.user_id && review.user_id !== user.id) {
      console.error('[generate-review-response] User does not own this review');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DEBUG: Vérifier toutes les variables d'environnement disponibles
    const allEnvKeys = Object.keys(Deno.env.toObject());
    console.log('[generate-review-response] Variables d\'environnement disponibles:', allEnvKeys.filter(k => k.includes('API') || k.includes('KEY') || k.includes('OPENAI')));
    
    const CLÉ_API_OPENAI = Deno.env.get('CLÉ_API_OPENAI');
    
    // DEBUG: Log sécurisé (premiers et derniers caractères seulement)
    if (CLÉ_API_OPENAI) {
      const preview = CLÉ_API_OPENAI.length > 10 
        ? `${CLÉ_API_OPENAI.substring(0, 4)}...${CLÉ_API_OPENAI.substring(CLÉ_API_OPENAI.length - 4)}`
        : '***';
      console.log('[generate-review-response] ✅ CLÉ_API_OPENAI trouvée (longueur:', CLÉ_API_OPENAI.length, 'preview:', preview, ')');
    } else {
      console.error('[generate-review-response] ❌ CLÉ_API_OPENAI non trouvée dans Deno.env');
      console.error('[generate-review-response] Vérifiez que la clé est bien configurée dans Supabase Dashboard → Edge Functions → Secrets');
      
      // Vérifier aussi les variantes possibles
      const alternativeKeys = ['LOVABLE_API_KEY', 'VITE_LOVABLE_API_KEY', 'LOVABLE_KEY'];
      for (const altKey of alternativeKeys) {
        const altValue = Deno.env.get(altKey);
        if (altValue) {
          console.warn(`[generate-review-response] ⚠️  ${altKey} trouvée mais CLÉ_API_OPENAI attendue`);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Configuration IA manquante',
          debug: 'CLÉ_API_OPENAI non trouvée dans les secrets Supabase. Vérifiez Dashboard → Edge Functions → Secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construire le prompt système avec toutes les règles
    const systemPrompt = `Tu es un assistant IA qui génère des réponses professionnelles et personnalisées aux avis clients pour ${establishment.name}.

RÈGLES ABSOLUES :
- Écrire TOUJOURS dans la MÊME LANGUE que l'avis client
- Ton chaleureux, professionnel, poli, jamais familier excessif
- NE JAMAIS mentionner que la réponse est générée par une IA
- NE PAS inventer de faits non présents dans l'avis
- NE PAS donner de données personnelles, horaires ou offres spécifiques
- NE PAS copier mot pour mot le texte de l'avis
- Maximum 0-2 emojis si approprié
- Longueur : 2-6 phrases selon la longueur de l'avis

COMPORTEMENT SELON LA NOTE :

⭐ AVIS TRÈS POSITIFS (4-5 étoiles) :
1. Remercier chaleureusement le client
2. Reprendre 1-2 éléments PRÉCIS mentionnés dans l'avis (qualité plats/cocktails, ambiance, service, cadre, rapport qualité-prix)
3. Inviter à revenir : "Au plaisir de vous revoir prochainement chez ${establishment.name} !"

😐 AVIS MITIGÉS (3 étoiles) :
1. Remercier pour le retour
2. Reconnaître les points positifs cités
3. Reconnaître les points négatifs (attente, plat pas assez chaud, prix, bruit...)
4. S'excuser brièvement
5. Expliquer que l'établissement s'améliore constamment
6. Proposer de revenir pour une meilleure expérience

😡 AVIS NÉGATIFS (1-2 étoiles) :
1. Remercier malgré tout pour le retour
2. S'excuser CLAIREMENT au nom de l'établissement
3. Montrer qu'on a COMPRIS le problème précis (temps d'attente, accueil froid, plat pas bon, erreur commande, serveur désagréable...)
4. Rester calme et professionnel, NE JAMAIS contredire agressivement
5. Proposer une solution/amélioration :
   - "Nous allons faire le point avec notre équipe"
   - "Nous renforçons le contrôle en cuisine"
6. Inviter à recontacter l'établissement : "N'hésitez pas à nous contacter directement"

THÉMATIQUES À DÉTECTER :
- Service / équipe / serveur(se)
- Qualité des plats / cocktails / boissons
- Temps d'attente / organisation
- Ambiance / musique / bruit
- Prix / rapport qualité-prix
- Cadre / décoration / propreté

STRUCTURE GÉNÉRALE :
1. Remerciement + mention du retour
2. Reprise d'éléments positifs (si présents)
3. Reconnaissance des points négatifs + excuse (si nécessaire)
4. Action ou intention d'amélioration concrète
5. Invitation à revenir/recontacter avec mention de ${establishment.name}`;

    // Construire le contexte de l'avis
    const reviewContext = `
INFORMATIONS DE L'ÉTABLISSEMENT :
- Nom : ${establishment.name}
${establishment.formatted_address ? `- Adresse : ${establishment.formatted_address}` : ''}
${establishment.category ? `- Type : ${establishment.category}` : ''}
${establishment.city ? `- Ville : ${establishment.city}` : ''}

AVIS CLIENT :
- Auteur : ${review.author || review.author_name || 'Client'}
- Note : ${review.rating}/5 étoiles
${review.published_at ? `- Date : ${new Date(review.published_at).toLocaleDateString('fr-FR')}` : ''}
${review.language || review.language_code ? `- Langue : ${review.language || review.language_code}` : ''}
- Texte de l'avis : "${review.text}"

TÂCHE : Génère une réponse professionnelle, personnalisée et chaleureuse à cet avis. Respecte TOUTES les règles ci-dessus.`;

    console.log('[generate-review-response] Appel à OpenAI API...');
    console.log('[generate-review-response] URL:', 'https://api.openai.com/v1/chat/completions');
    console.log('[generate-review-response] Headers Authorization:', `Bearer ${CLÉ_API_OPENAI.substring(0, 10)}...`);

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLÉ_API_OPENAI}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: reviewContext }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[generate-review-response] ❌ Erreur API IA:', aiResponse.status);
      console.error('[generate-review-response] Status:', aiResponse.status);
      console.error('[generate-review-response] Status Text:', aiResponse.statusText);
      console.error('[generate-review-response] Response Body:', errorText.substring(0, 500));
      
      // Log spécifique pour 401 Unauthorized
      if (aiResponse.status === 401) {
        console.error('[generate-review-response] 🔐 401 Unauthorized - La clé API est invalide ou expirée');
        console.error('[generate-review-response] Vérifiez que CLÉ_API_OPENAI dans Supabase Secrets est correcte');
        return new Response(
          JSON.stringify({ 
            error: 'Clé API invalide',
            debug: 'La clé CLÉ_API_OPENAI est invalide ou expirée. Vérifiez dans Supabase Dashboard → Edge Functions → Secrets'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requêtes atteinte. Veuillez réessayer dans quelques instants.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Crédits IA insuffisants. Veuillez recharger votre compte.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Erreur API IA: ${aiResponse.status} - ${errorText.substring(0, 200)}`);
    }

    const aiData = await aiResponse.json();
    const generatedResponse = aiData.choices?.[0]?.message?.content;

    if (!generatedResponse) {
      throw new Error('Aucune réponse générée par l\'IA');
    }

    console.log('[generate-review-response] ✅ Réponse générée avec succès');
    console.log('[generate-review-response] Longueur:', generatedResponse.length, 'caractères');

    return new Response(
      JSON.stringify({ response: generatedResponse.trim() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[generate-review-response] ❌ Erreur:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Erreur lors de la génération de la réponse' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
