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

    // Get detailed summary with duplicates info using raw SQL
    const { data: summaryData, error: summaryError } = await supabase
      .rpc('get_reviews_summary_with_duplicates', {
        p_place_id: establishmentId,
        p_user_id: user.id
      });

    if (summaryError) {
      console.error('Error fetching summary:', summaryError);
      return Response.json({ error: 'Failed to fetch summary' }, { status: 500 });
    }

    const result = summaryData?.[0] || {
      total_all: 0,
      total_unique: 0,
      duplicates: 0,
      avg_rating: 0
    };

    return Response.json({
      totalAll: result.total_all,
      totalUnique: result.total_unique,
      duplicates: result.duplicates,
      avgRating: result.avg_rating
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}