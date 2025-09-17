import { supabase } from "@/integrations/supabase/client";

export async function GET(request: Request) {
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

    // Get detailed summary with duplicates info using direct query
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, rating, dedup_key')
      .eq('user_id', user.id)
      .eq('place_id', establishmentId);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Calculate stats manually
    const totalAll = reviews?.length || 0;
    const uniqueKeys = new Set(reviews?.map(r => r.dedup_key || r.id) || []);
    const totalUnique = uniqueKeys.size;
    const duplicates = totalAll - totalUnique;
    const avgRating = totalAll > 0 ? 
      reviews!.reduce((sum, r) => sum + (r.rating || 0), 0) / totalAll : 0;

    return Response.json({
      totalAll,
      totalUnique,
      duplicates,
      avgRating: Math.round(avgRating * 100) / 100
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}