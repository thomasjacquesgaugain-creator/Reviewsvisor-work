import { supabase } from "@/integrations/supabase/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const establishmentId = searchParams.get('establishmentId');
    const limit = parseInt(searchParams.get('limit') || '500');
    const cursor = searchParams.get('cursor');

    if (!establishmentId) {
      return Response.json({ error: 'establishmentId is required' }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query with DISTINCT to avoid duplicates even if they exist
    let query = supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('place_id', establishmentId)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('inserted_at', { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.gt('id', parseInt(cursor));
    }

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    const result = {
      items: reviews || [],
      nextCursor: reviews && reviews.length === limit ? 
        reviews[reviews.length - 1].id.toString() : undefined
    };

    return Response.json(result);

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}