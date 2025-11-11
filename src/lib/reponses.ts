import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère les statistiques des réponses validées
 * @param establishmentId - Place ID de l'établissement
 * @param userId - ID de l'utilisateur
 * @returns { validated: number, total: number }
 */
export async function getReponsesStats(establishmentId?: string, userId?: string): Promise<{ validated: number; total: number }> {
  try {
    if (!establishmentId || !userId) {
      return { validated: 0, total: 0 };
    }

    // Récupérer le nombre de réponses validées
    const { count: validatedCount, error: validatedError } = await supabase
      .from('reponses')
      .select('*', { count: 'exact', head: true })
      .eq('statut', 'valide')
      .eq('etablissement_id', establishmentId)
      .eq('user_id', userId);

    if (validatedError) {
      console.error('Error fetching validated responses:', validatedError);
    }

    // Récupérer le nombre total d'avis pour cet établissement
    const { count: totalCount, error: totalError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', establishmentId)
      .eq('user_id', userId);

    if (totalError) {
      console.error('Error fetching total reviews:', totalError);
    }

    return {
      validated: validatedCount || 0,
      total: totalCount || 0
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
