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
  raw_fingerprint?: string; // Fingerprint for paste deduplication
}

export interface BulkCreateResult {
  inserted: number;
  skipped: number;
  reasons?: {
    duplicate?: number;
    missingRating?: number;
    missingEstablishment?: number;
  };
  sampleSkipped?: Array<{
    reason: string;
    snippet: string;
  }>;
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
  let skippedTotal = 0;
  const reasons = {
    duplicate: 0,
    missingRating: 0,
    missingEstablishment: 0
  };
  const sampleSkipped: Array<{ reason: string; snippet: string }> = [];
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  for (const review of reviews) {
    try {
      // Validate required fields
      if (!review.establishment_id || !review.establishment_place_id) {
        reasons.missingEstablishment++;
        if (sampleSkipped.length < 5) {
          sampleSkipped.push({
            reason: 'missing_establishment',
            snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
          });
        }
        skippedTotal++;
        continue;
      }

      if (!review.rating || review.rating < 1 || review.rating > 5) {
        reasons.missingRating++;
        if (sampleSkipped.length < 5) {
          sampleSkipped.push({
            reason: 'missing_rating',
            snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
          });
        }
        skippedTotal++;
        continue;
      }

      // Create hash for deduplication
      let reviewHash: string;
      
      if (review.import_method === "paste" && review.raw_fingerprint) {
        // Use fingerprint for paste imports to avoid over-deduplication
        reviewHash = simpleHash(`${review.establishment_id}|${review.raw_fingerprint}`);
      } else {
        // Fallback to strict deduplication for other imports
        const normalizedText = (review.comment || "").toLowerCase().trim();
        const authorName = `${review.author_first_name || ""} ${review.author_last_name || ""}`.trim();
        const hashInput = `${review.establishment_id}|${authorName}|${review.review_date || ""}|${review.rating}|${normalizedText}|${review.source || ""}`;
        reviewHash = simpleHash(hashInput);
      }
      
      // Check if review already exists (by source_review_id which stores our hash)
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('user_id', user.user.id)
        .eq('source_review_id', reviewHash)
        .single();
      
      if (existingReview) {
        reasons.duplicate++;
        if (sampleSkipped.length < 5) {
          sampleSkipped.push({
            reason: 'duplicate',
            snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
          });
        }
        skippedTotal++;
        continue;
      }
      
      // Parse review date safely
      let publishedAt: string | null = null;
      if (review.review_date) {
        try {
          const date = new Date(review.review_date);
          if (!isNaN(date.getTime()) && review.review_date !== 'Invalid Date') {
            publishedAt = date.toISOString();
          }
        } catch (e) {
          // Invalid date, keep null
        }
      }
      
      // Insert new review
      const { error } = await supabase
        .from('reviews')
        .insert({
          user_id: user.user.id,
          place_id: review.establishment_place_id,
          source: review.source,
          author: `${review.author_first_name} ${review.author_last_name}`.trim() || 'Anonyme',
          rating: review.rating,
          text: review.comment || "",
          published_at: publishedAt,
          source_review_id: reviewHash,
          raw: {
            import_method: review.import_method,
            import_source_url: review.import_source_url,
            author_first_name: review.author_first_name,
            author_last_name: review.author_last_name,
            establishment_name: review.establishment_name,
            raw_fingerprint: review.raw_fingerprint
          }
        });
      
      if (error) {
        console.error('Error inserting review:', error);
        skippedTotal++;
      } else {
        inserted++;
      }
    } catch (error) {
      console.error('Error processing review:', error);
      skippedTotal++;
    }
  }
  
  return { 
    inserted, 
    skipped: skippedTotal,
    reasons,
    sampleSkipped
  };
}

export async function list(establishmentId: string, limit = 500, cursor?: string) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  let query = supabase
    .from('reviews')
    .select('*')
    .eq('user_id', user.user.id)
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
    throw error;
  }

  return {
    items: reviews || [],
    nextCursor: reviews && reviews.length === limit ? reviews[reviews.length - 1].id.toString() : undefined
  };
}

export async function listAll(establishmentId: string) {
  let all: any[] = [];
  let cursor: string | undefined;
  
  do {
    const { items, nextCursor } = await list(establishmentId, 500, cursor);
    all = all.concat(items || []);
    cursor = nextCursor;
  } while (cursor);
  
  return all;
}

export async function getReviewsList(establishmentId: string, options?: { limit?: number; cursor?: string }) {
  return list(establishmentId, options?.limit || 50, options?.cursor);
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