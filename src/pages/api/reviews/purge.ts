import { supabase } from "@/integrations/supabase/client";

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

async function resolveEstablishmentId(inputId: string) {
  // Pour ce projet, on utilise directement le place_id comme identifiant
  return inputId;
}

export default async function handler(req: any, res: any) {
  try {
    let establishmentId = (req.method === "POST")
      ? (req.body?.establishmentId as string)
      : (req.query?.establishmentId as string);

    if (!establishmentId) {
      return res.status(400).json({ error: "establishmentId requis" });
    }

    establishmentId = await resolveEstablishmentId(establishmentId);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    // Delete all reviews for this establishment and user
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('place_id', establishmentId)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Supabase delete error:', error);
      return res.status(500).json({ 
        error: `Erreur base de données: ${error.message}` 
      });
    }

    const deletedCount = data?.length || 0;

    return res.status(200).json({ deleted: deletedCount });
    
  } catch (err: any) {
    console.error('Purge error:', err);
    return res.status(500).json({ 
      error: err?.message || "Erreur serveur" 
    });
  }
}