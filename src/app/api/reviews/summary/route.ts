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

    // Get detailed summary with duplicates info using direct SQL
    const { data: summaryData, error: summaryError } = await supabase
      .from('reviews')
      .select('rating, dedup_key')
      .eq('place_id', establishmentId)
      .eq('user_id', user.id);

    if (summaryError) {
      console.error('Error fetching summary:', summaryError);
      return Response.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }

    if (!summaryData || summaryData.length === 0) {
      return Response.json({
        totalAll: 0,
        totalUnique: 0,
        duplicates: 0,
        avgRating: 0
      });
    }

    // Calculate summary from the data
    const totalAll = summaryData.length;
    const uniqueKeys = new Set(summaryData.map(r => r.dedup_key).filter(Boolean));
    const totalUnique = uniqueKeys.size;
    const duplicates = totalAll - totalUnique;
    const avgRating = summaryData.reduce((sum, r) => sum + (r.rating || 0), 0) / totalAll;

    return Response.json({
      totalAll,
      totalUnique,
      duplicates,
      avgRating: Number(avgRating.toFixed(2))
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}