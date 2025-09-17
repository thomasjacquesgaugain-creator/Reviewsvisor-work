import { supabase } from "@/integrations/supabase/client";

export interface ReviewCreate {
  establishment_id: string;
  establishment_place_id: string;
  establishment_name: string;
  source: string;
  author_first_name: string;
  author_last_name: string;
  rating: number;
  comment: string; // Can be empty string
  review_date?: string | null;
  import_method: string;
  import_source_url?: string | null;
}

export interface BulkCreateResult {
  inserted: number;
  skipped: number;
}

// Simple hash function for deduplication
function simpleHash(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

export async function bulkCreateReviews(reviews: ReviewCreate[]): Promise<BulkCreateResult> {
  let inserted = 0;
  let skipped = 0;
  
  for (const review of reviews) {
    try {
      // Create hash for deduplication
      const normalizedText = (review.comment || "").toLowerCase().trim();
      const authorName = `${review.author_first_name} ${review.author_last_name}`.trim();
      const hashInput = `${review.establishment_id}|${review.author_first_name || ""}|${review.author_last_name || ""}|${review.review_date || ""}|${review.rating}|${normalizedText}`;
      const reviewHash = simpleHash(hashInput);
      
      // Check if review already exists (by hash)
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('place_id', review.establishment_place_id)
        .eq('text', review.comment || "")
        .single();
      
      if (existingReview) {
        skipped++;
        continue;
      }
      
      // Insert new review
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          place_id: review.establishment_place_id,
          source: review.source,
          author: `${review.author_first_name} ${review.author_last_name}`.trim(),
          rating: review.rating,
          text: review.comment || "",
          published_at: review.review_date ? new Date(review.review_date).toISOString() : null,
          source_review_id: reviewHash,
          raw: {
            import_method: review.import_method,
            import_source_url: review.import_source_url,
            author_first_name: review.author_first_name,
            author_last_name: review.author_last_name,
            establishment_name: review.establishment_name
          }
        });
      
      if (error) {
        console.error('Error inserting review:', error);
        skipped++;
      } else {
        inserted++;
      }
    } catch (error) {
      console.error('Error processing review:', error);
      skipped++;
    }
  }
  
  return { inserted, skipped };
}

export async function getReviewsList(establishmentId: string, options?: { limit?: number; cursor?: string }) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  const limit = options?.limit || 50;
  let query = supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('place_id', establishmentId)
    .order('published_at', { ascending: false })
    .order('inserted_at', { ascending: false })
    .limit(limit);

  if (options?.cursor) {
    query = query.gt('id', parseInt(options.cursor));
  }

  const { data: reviews, error } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  return {
    items: reviews || [],
    nextCursor: reviews && reviews.length === limit ? reviews[reviews.length - 1].id.toString() : undefined
  };
}

export async function listAllReviews(establishmentId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Get ALL reviews for the establishment (no limit)
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('place_id', establishmentId)
    .order('published_at', { ascending: false })
    .order('inserted_at', { ascending: false });

  if (error) {
    console.error('Error fetching all reviews:', error);
    throw error;
  }

  return reviews || [];
}

export async function getReviewsSummary(establishmentId: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Get all reviews for the establishment
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating, published_at')
    .eq('user_id', user.user.id)
    .eq('place_id', establishmentId);

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  if (!reviews || reviews.length === 0) {
    return {
      total: 0,
      avgRating: 0,
      byStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byMonth: []
    };
  }

  // Calculate metrics
  const total = reviews.length;
  const avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total;

  // Group by stars
  const byStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      byStars[Math.floor(r.rating) as keyof typeof byStars]++;
    }
  });

  // Group by month (last 12 months)
  const monthCounts: Record<string, { count: number; total: number }> = {};
  const now = new Date();
  
  reviews.forEach(r => {
    if (r.published_at) {
      const date = new Date(r.published_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthCounts[monthKey]) {
        monthCounts[monthKey] = { count: 0, total: 0 };
      }
      monthCounts[monthKey].count++;
      monthCounts[monthKey].total += r.rating || 0;
    }
  });

  const byMonth = Object.entries(monthCounts)
    .map(([month, data]) => ({
      month,
      count: data.count,
      avg: data.count > 0 ? data.total / data.count : 0
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12); // Last 12 months

  return {
    total,
    avgRating,
    byStars,
    byMonth
  };
}