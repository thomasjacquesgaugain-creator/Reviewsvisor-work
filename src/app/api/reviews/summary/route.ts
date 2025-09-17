export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

    // Get reviews summary directly from the reviews table
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, dedup_key')
      .eq('place_id', establishmentId)
      .eq('user_id', user.id);

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError);
      return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    const totalAll = reviews?.length || 0;
    const uniqueKeys = new Set(reviews?.map(r => r.dedup_key).filter(Boolean) || []);
    const totalUnique = uniqueKeys.size;
    const duplicates = totalAll - totalUnique;
    const avgRating = reviews?.length > 0 
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length 
      : 0;

    return Response.json({
      totalAll,
      totalUnique,
      duplicates,
      avgRating: Number(avgRating.toFixed(1))
    }, {
      // Empêcher tout cache intermédiaire
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}