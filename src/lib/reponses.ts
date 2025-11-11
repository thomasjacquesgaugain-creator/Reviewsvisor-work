import { supabase } from "@/integrations/supabase/client";

/**
 * Récupère les statistiques des réponses validées
 * @param establishmentId - Place ID de l'établissement
 * @param userId - ID de l'utilisateur
 * @returns { validated: number, total: number }
 */
export async function getReponsesStats(establishmentId?: string, userId?: string): Promise<{ validated: number; total: number }> {
  try {
    // Récupérer le nombre de réponses validées
    const { count: validatedCount, error: validatedError } = await supabase
      .from('reponses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'validated')
      .eq('establishment_id', establishmentId || '')
      .eq('user_id', userId || '');

    if (validatedError) {
      console.error('Error fetching validated responses:', validatedError);
      throw new Error(validatedError.message);
    }

    // Récupérer le nombre total d'avis pour cet établissement
    const { count: totalCount, error: totalError } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('place_id', establishmentId || '')
      .eq('user_id', userId || '');

    if (totalError) {
      console.error('Error fetching total reviews:', totalError);
      throw new Error(totalError.message);
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
 * Valide une réponse à un avis
 * @param params - { avisId: string, responseText: string, establishmentId: string, userId: string }
 */
export async function validateReponse(params: {
  avisId: string;
  responseText: string;
  establishmentId: string;
  userId: string;
}): Promise<void> {
  const { avisId, responseText, establishmentId, userId } = params;

  const { error } = await supabase
    .from('reponses')
    .upsert(
      {
        avis_id: avisId,
        review_id: avisId,
        establishment_id: establishmentId,
        response_text: responseText,
        user_id: userId,
        status: 'validated',
        validated_at: new Date().toISOString()
      },
      { onConflict: 'avis_id' }
    );

  if (error) {
    console.error('validateReponse error:', error);
    throw new Error(error.message || "Erreur lors de la validation de la réponse");
  }
}
