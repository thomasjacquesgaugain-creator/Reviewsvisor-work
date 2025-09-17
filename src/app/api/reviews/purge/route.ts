import { supabase } from "@/integrations/supabase/client";

export async function POST(request: Request) {
  try {
    const { establishmentId } = await request.json();
    
    if (!establishmentId) {
      return Response.json({ error: 'establishmentId manquant' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all reviews for this establishment and user
    const { error, count } = await supabase
      .from("reviews")
      .delete({ count: "exact" })
      .eq("user_id", user.id)
      .eq("place_id", establishmentId);

    if (error) {
      console.error('Error deleting reviews:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ deleted: count ?? 0 });

  } catch (error: any) {
    console.error('Unexpected error:', error);
    return Response.json({ error: error?.message ?? "Erreur inconnue" }, { status: 500 });
  }
}