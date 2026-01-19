import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère les statistiques des réponses validées
 * INCLUT les réponses validées depuis localStorage ET la base de données
 * @param establishmentId - Place ID de l'établissement
 * @param userId - ID de l'utilisateur
 * @returns { validated: number, total: number }
 */
export async function getReponsesStats(establishmentId?: string, userId?: string): Promise<{ validated: number; total: number }> {
  try {
    if (!establishmentId || !userId) {
      return { validated: 0, total: 0 };
    }

    // Objectif produit : le compteur "réponses validées" doit refléter les avis "répondu".
    // Un avis est considéré "répondu" s'il a :
    // - une réponse validée (table reponses, statut=valide)
    // - OU une réponse déjà publiée côté plateforme (owner_reply_text / responded_at)

    const { data: dbResponses, error: responsesError } = await supabase
      .from('reponses')
      .select('avis_id')
      .eq('statut', 'valide')
      .eq('etablissement_id', establishmentId)
      .eq('user_id', userId);

    if (responsesError) {
      console.error('Error fetching validated responses:', responsesError);
    }

    const validatedIds = new Set<number>((dbResponses || []).map(r => parseInt(r.avis_id)));

    // Charger les avis de l'établissement pour :
    // - total
    // - ids des avis déjà répondus directement sur la plateforme
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, owner_reply_text, responded_at')
      .eq('place_id', establishmentId)
      .eq('user_id', userId);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
    }

    const reviewIds = new Set<number>((reviews || []).map((r: any) => r.id));

    // Éviter le sur-comptage : certaines entrées dans `reponses` peuvent référencer des avis qui
    // n'existent plus dans `reviews` (ou ne font pas partie du périmètre courant).
    const validatedIdsInReviews = new Set<number>(
      [...validatedIds].filter(id => reviewIds.has(id))
    );

    const directRespondedIds = new Set<number>();
    (reviews || []).forEach((r: any) => {
      const hasOwnerReply = !!(r.owner_reply_text && String(r.owner_reply_text).trim());
      const hasRespondedAt = !!r.responded_at;
      if (hasOwnerReply || hasRespondedAt) {
        directRespondedIds.add(r.id);
      }
    });

    const combinedIds = new Set<number>([...validatedIdsInReviews, ...directRespondedIds]);

    return {
      validated: combinedIds.size,
      total: (reviews || []).length
    };
  } catch (error) {
    console.error('getReponsesStats error:', error);
    return { validated: 0, total: 0 };
  }
}

/**
 * Valide une réponse à un avis avec upsert
 * @param params - { avisId: string, contenu: string, etablissementId: string, userId: string }
 */
export async function validateReponse(params: {
  avisId: string;
  contenu: string;
  etablissementId: string;
  userId: string;
}): Promise<void> {
  const { avisId, contenu, etablissementId, userId } = params;

  // Vérifier que l'utilisateur est authentifié
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Vous devez être connecté pour valider une réponse");
  }

  // Upsert pour éviter les doublons (contrainte unique sur avis_id, etablissement_id)
  const { error } = await supabase
    .from('reponses')
    .upsert({
      avis_id: avisId,
      contenu: contenu,
      statut: 'valide',
      validated_at: new Date().toISOString(),
      user_id: userId,
      etablissement_id: etablissementId
    }, {
      onConflict: 'avis_id,etablissement_id'
    });

  if (error) {
    console.error('validateReponse error:', error);
    
    // Messages d'erreur personnalisés
    if (error.message.includes('row-level security') || error.message.includes('WITH CHECK')) {
      throw new Error("Enregistrement refusé par la sécurité des lignes (RLS). Assurez-vous que user_id = auth.uid() et que l'établissement courant est correct.");
    }
    
    throw new Error(error.message || "Erreur lors de la validation de la réponse");
  }
}
