import { supabase } from "@/integrations/supabase/client";
import { Avis } from "@/types/avis";

export async function getAvisByEtablissement(etablissementId: string): Promise<Avis[]> {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('place_id', etablissementId);

    if (error) {
      console.error('Error fetching reviews:', error);
      throw new Error('Impossible de récupérer les avis');
    }

    // Transform reviews to Avis format
    return (data || []).map(review => ({
      id: review.id.toString(),
      etablissementId: review.place_id,
      source: (review.source as "google" | "facebook" | "thefork" | "autre") || "autre",
      note: Number(review.rating) || 0,
      texte: review.text || '',
      date: review.published_at || review.inserted_at
    }));
  } catch (error) {
    console.error('Error in getAvisByEtablissement:', error);
    throw error;
  }
}