import { supabase } from "@/integrations/supabase/client";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');

    if (!establishmentId) {
      return Response.json({ error: 'establishmentId is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete all reviews for this establishment and user
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('place_id', establishmentId)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Error deleting reviews:', error);
      return Response.json({ error: 'Failed to delete reviews' }, { status: 500 });
    }

    const deletedCount = data?.length || 0;

    return Response.json({
      deleted: deletedCount,
      message: `${deletedCount} avis supprimés`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}