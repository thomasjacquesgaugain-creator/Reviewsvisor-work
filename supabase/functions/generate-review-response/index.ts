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
    
    // STEP 1: Validate authentication - Récupérer et valider le token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[generate-review-response] Missing Authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extraire le token (enlever "Bearer ")
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      console.error('[generate-review-response] Token vide après extraction');
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-review-response] Token reçu, longueur:', token.length);

    // Créer le client Supabase et valider le token
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Utiliser getUser(token) directement avec le token extrait
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('[generate-review-response] Authentication failed:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[generate-review-response] Authenticated user:', user.id);
    
    // STEP 2: Get and validate request data
    const { review, establishment } = await req.json();
    
    // Validation de base : review et establishment doivent exister
    if (!review || !establishment) {
      console.error('[generate-review-response] Données manquantes:', { 
        hasReview: !!review, 
        hasEstablishment: !!establishment 
      });
      return new Response(
        JSON.stringify({ error: 'Données manquantes (review ou establishment)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // STEP 3: Validate input data
    // Le texte de l'avis est maintenant optionnel (peut être vide, null, ou "Pas de commentaire")
    // Seuls rating et establishment.name sont obligatoires
    if (!review.rating || typeof review.rating !== 'number' || review.rating < 1 || review.rating > 5) {
      console.error('[generate-review-response] Rating invalide:', review.rating);
      return new Response(
        JSON.stringify({ error: 'Invalid request data: rating must be a number between 1 and 5' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!establishment.name || typeof establishment.name !== 'string' || establishment.name.trim() === '') {
      console.error('[generate-review-response] Establishment name invalide:', establishment.name);
      return new Response(
        JSON.stringify({ error: 'Invalid request data: establishment name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normaliser le texte de l'avis (gérer null, undefined, ou chaîne vide)
    // Le texte est OPTIONNEL - on accepte les avis sans commentaire
    const reviewText = (review.text != null ? String(review.text) : '').trim();
    
    // Extraire le nom du client (peut être author, author_name, reviewerName, etc.)
    const reviewerName = review.author || review.author_name || review.reviewerName || 'Client';
    
    console.log('[generate-review-response] Données reçues:', { 
      reviewText: reviewText ? reviewText.substring(0, 50) : '(vide)',
      rating: review.rating,
      reviewerName: reviewerName,
      establishmentName: establishment.name
    });

    // Vérifier si l'avis a un commentaire valide
    const hasComment = reviewText !== '' && 
                       reviewText.toLowerCase() !== 'pas de commentaire';

    // Limit text length to prevent abuse (seulement si texte présent)
    if (hasComment && reviewText.length > 5000) {
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
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    // DEBUG: Log sécurisé (premiers et derniers caractères seulement)
    if (OPENAI_API_KEY) {
      const preview = OPENAI_API_KEY.length > 10 
        ? `${OPENAI_API_KEY.substring(0, 4)}...${OPENAI_API_KEY.substring(OPENAI_API_KEY.length - 4)}`
        : '***';
      console.log('[generate-review-response] ✅ OPENAI_API_KEY trouvée (longueur:', OPENAI_API_KEY.length, 'preview:', preview, ')');
    } else {
      console.error('[generate-review-response] ❌ OPENAI_API_KEY non trouvée dans Deno.env');
      console.error('[generate-review-response] Vérifiez que la clé est bien configurée dans Supabase Dashboard → Edge Functions → Secrets');
      
      // Vérifier aussi les variantes possibles
      const alternativeKeys = ['LOVABLE_API_KEY', 'VITE_LOVABLE_API_KEY', 'LOVABLE_KEY'];
      for (const altKey of alternativeKeys) {
        const altValue = Deno.env.get(altKey);
        if (altValue) {
          console.warn(`[generate-review-response] ⚠️  ${altKey} trouvée mais OPENAI_API_KEY attendue`);
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Configuration IA manquante',
          debug: 'OPENAI_API_KEY non trouvée dans les secrets Supabase. Vérifiez Dashboard → Edge Functions → Secrets'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Déterminer si on génère une réponse générique (sans commentaire) ou personnalisée (avec commentaire)
    let systemPrompt: string;
    let reviewContext: string;

    if (!hasComment) {
      // CAS 1: Avis sans commentaire - Réponse générique basée uniquement sur la note et le nom du client
      const rating = review.rating;
      
      systemPrompt = `Tu es un assistant IA qui génère des réponses professionnelles et chaleureuses aux avis clients pour ${establishment.name}.

RÈGLES ABSOLUES :
- Ton chaleureux, professionnel, poli
- NE JAMAIS mentionner que la réponse est générée par une IA
- Réponse courte et concise (2-3 phrases maximum)
- Maximum 0-1 emoji si approprié
- Utiliser le prénom du client si fourni (sinon utiliser un ton général)

COMPORTEMENT SELON LA NOTE :

⭐ 5 ÉTOILES :
Génère une réponse de remerciement chaleureux pour la note de 5 étoiles. Exemple de ton : "Merci beaucoup pour votre 5 étoiles ! Votre satisfaction est notre priorité. Au plaisir de vous revoir bientôt !"

⭐ 4 ÉTOILES :
Génère une réponse positive et reconnaissante pour la note de 4 étoiles. Exemple de ton : "Merci pour votre avis positif ! Nous sommes ravis que votre expérience vous ait plu. À bientôt !"

😐 3 ÉTOILES :
Génère une réponse neutre et ouverte pour la note de 3 étoiles. Exemple de ton : "Merci pour votre retour. Nous prenons en compte votre avis pour nous améliorer. N'hésitez pas à nous faire part de vos suggestions."

😡 1-2 ÉTOILES :
Génère une réponse empathique et professionnelle pour une note faible. Exemple de ton : "Merci d'avoir pris le temps de nous évaluer. Nous sommes désolés que votre expérience n'ait pas été à la hauteur. Contactez-nous pour en discuter."

IMPORTANT : Génère UNIQUEMENT la réponse, sans explication ni contexte supplémentaire.`;

      reviewContext = `
INFORMATIONS DE L'ÉTABLISSEMENT :
- Nom : ${establishment.name}
${establishment.formatted_address ? `- Adresse : ${establishment.formatted_address}` : ''}

AVIS CLIENT :
- Nom du client : ${reviewerName}
- Note : ${rating}/5 étoiles
- Commentaire : Aucun commentaire fourni

TÂCHE : Génère une réponse professionnelle et chaleureuse adressée à ${reviewerName}, basée uniquement sur sa note de ${rating} étoiles. Remercie ${reviewerName} pour sa note.`;
    } else {
      // CAS 2: Avis avec commentaire - Réponse personnalisée basée sur le texte
      systemPrompt = `Tu es un assistant IA qui génère des réponses professionnelles et personnalisées aux avis clients pour ${establishment.name}.

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

      reviewContext = `
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
- Texte de l'avis : "${reviewText}"

TÂCHE : Génère une réponse professionnelle, personnalisée et chaleureuse à cet avis. Respecte TOUTES les règles ci-dessus.`;
    }

    console.log('[generate-review-response] Mode:', hasComment ? 'Réponse personnalisée (avec commentaire)' : 'Réponse générique (sans commentaire)');
    console.log('[generate-review-response] Appel à OpenAI API...');
    console.log('[generate-review-response] URL:', 'https://api.openai.com/v1/chat/completions');
    console.log('[generate-review-response] Headers Authorization:', `Bearer ${OPENAI_API_KEY.substring(0, 10)}...`);

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
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
        console.error('[generate-review-response] Vérifiez que OPENAI_API_KEY dans Supabase Secrets est correcte');
        return new Response(
          JSON.stringify({ 
            error: 'Clé API invalide',
            debug: 'La clé OPENAI_API_KEY est invalide ou expirée. Vérifiez dans Supabase Dashboard → Edge Functions → Secrets'
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
