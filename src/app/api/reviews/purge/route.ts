import { supabase } from "@/integrations/supabase/client";

async function resolveEstablishmentId(inputId: string): Promise<string> {
  // Si c'est déjà un UUID ou un place_id Google, on l'utilise tel quel
  return inputId;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let { establishmentId } = body || {};
    
    if (!establishmentId) {
      return Response.json({ error: "establishmentId requis" }, { status: 400 });
    }

    establishmentId = await resolveEstablishmentId(establishmentId);

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
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
      return Response.json({ 
        error: `Erreur base de données: ${error.message}` 
      }, { status: 500 });
    }

    const deletedCount = data?.length || 0;

    return Response.json({ deleted: deletedCount });
    
  } catch (err: any) {
    console.error('Purge error:', err);
    return Response.json({ 
      error: err?.message || "Erreur serveur inconnue" 
    }, { status: 500 });
  }
}

// Optionnel: aussi supporter DELETE ?establishmentId=...
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const establishmentIdParam = searchParams.get("establishmentId");
  
  if (!establishmentIdParam) {
    return Response.json({ error: "establishmentId requis" }, { status: 400 });
  }
  
  const fakeReq = new Request(req.url, { 
    method: "POST", 
    body: JSON.stringify({ establishmentId: establishmentIdParam }),
    headers: { "Content-Type": "application/json" }
  });
  
  return POST(fakeReq);
}