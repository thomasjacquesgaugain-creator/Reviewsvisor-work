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
  const reasons = {
    duplicate: 0,
    missingRating: 0,
    missingEstablishment: 0
  };
  const sampleSkipped: Array<{ reason: string; snippet: string }> = [];
  
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('User not authenticated');

  // Step 1: Pre-validate and generate dedupKeys for all reviews
  const validReviews: Array<ReviewCreate & { dedupKey: string }> = [];
  let skippedTotal = 0;

  for (const review of reviews) {
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

    // Generate dedupKey 
    let dedupKey: string;
    if (review.import_method === "paste" && review.raw_fingerprint) {
      // Use fingerprint for paste imports
      dedupKey = simpleHash(`${review.establishment_place_id}|${review.raw_fingerprint}`);
    } else {
      // Fallback to content-based deduplication
      const normalizedText = (review.comment || "").toLowerCase().trim();
      const authorName = `${review.author_first_name || ""} ${review.author_last_name || ""}`.trim();
      const hashInput = `${review.establishment_place_id}|${authorName}|${review.review_date || ""}|${review.rating}|${normalizedText}|${review.source || ""}`;
      dedupKey = simpleHash(hashInput);
    }

    validReviews.push({ ...review, dedupKey });
  }

  if (validReviews.length === 0) {
    return { inserted: 0, skipped: skippedTotal, reasons, sampleSkipped };
  }

  // Step 2: Check for existing dedupKeys to filter duplicates BEFORE insertion
  const dedupKeys = validReviews.map(r => r.dedupKey);
  const { data: existingReviews } = await supabase
    .from('reviews')
    .select('dedup_key')
    .eq('user_id', user.user.id)
    .eq('place_id', validReviews[0].establishment_place_id)
    .in('dedup_key', dedupKeys);

  const existingKeys = new Set(existingReviews?.map(r => r.dedup_key) || []);
  const toInsert = validReviews.filter(r => !existingKeys.has(r.dedupKey));
  
  // Count duplicates found during pre-filtering
  const duplicatesCount = validReviews.length - toInsert.length;
  reasons.duplicate = duplicatesCount;
  
  // Add duplicate samples
  for (const review of validReviews) {
    if (existingKeys.has(review.dedupKey) && sampleSkipped.length < 5) {
      sampleSkipped.push({
        reason: 'duplicate',
        snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
      });
    }
  }

  skippedTotal += duplicatesCount;

  if (toInsert.length === 0) {
    return { inserted: 0, skipped: skippedTotal, reasons, sampleSkipped };
  }

  // Step 3: Bulk insert only unique reviews
  const reviewsToInsert = toInsert.map(review => {
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

    return {
      user_id: user.user.id,
      place_id: review.establishment_place_id,
      source: review.source,
      author: `${review.author_first_name} ${review.author_last_name}`.trim() || 'Anonyme',
      rating: review.rating,
      text: review.comment || "",
      published_at: publishedAt,
      source_review_id: review.dedupKey, // Keep for backward compatibility
      dedup_key: review.dedupKey, // New dedup_key column
      raw: {
        import_method: review.import_method,
        import_source_url: review.import_source_url,
        author_first_name: review.author_first_name,
        author_last_name: review.author_last_name,
        establishment_name: review.establishment_name,
        raw_fingerprint: review.raw_fingerprint
      }
    };
  });

  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewsToInsert)
      .select('id');

    if (error) {
      console.error('Bulk insert error:', error);
      throw error;
    }

    const inserted = data?.length || 0;
    return { 
      inserted, 
      skipped: skippedTotal,
      reasons,
      sampleSkipped
    };
  } catch (error) {
    console.error('Error in bulk insert:', error);
    throw error;
  }
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

  // Get all reviews for ratings calculations (use DISTINCT to avoid duplicates)
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select('rating, published_at, dedup_key')
    .eq('user_id', user.user.id)
    .eq('place_id', establishmentId)
    .order('dedup_key')
    .order('inserted_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }

  // Remove duplicates by dedup_key (keep first occurrence)
  const uniqueReviews = reviews ? reviews.filter((review, index, arr) => 
    !review.dedup_key || arr.findIndex(r => r.dedup_key === review.dedup_key) === index
  ) : [];

  if (uniqueReviews.length === 0) {
    return {
      total: 0,
      avgRating: 0,
      byStars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      byMonth: []
    };
  }

  // Use filtered unique count
  const total = uniqueReviews.length;
  const avgRating = uniqueReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / uniqueReviews.length;

  // Group by stars (using unique reviews only)
  const byStars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  uniqueReviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      byStars[Math.floor(r.rating) as keyof typeof byStars]++;
    }
  });

  // Group by month (last 12 months, using unique reviews only)
  const monthCounts: Record<string, { count: number; total: number }> = {};
  const now = new Date();
  
  uniqueReviews.forEach(r => {
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

export interface ReviewsSummaryWithDuplicates {
  totalAll: number;
  totalUnique: number;
  duplicates: number;
  avgRating: number;
}

export async function getReviewsSummaryWithDuplicates(establishmentId: string): Promise<ReviewsSummaryWithDuplicates> {
  const response = await fetch(`/api/reviews/summary?establishmentId=${encodeURIComponent(establishmentId)}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch reviews summary');
  }
  
  return response.json();
}

export async function cleanupDuplicateReviews(establishmentId: string): Promise<{ deleted: number }> {
  const response = await fetch(`/api/reviews/dedupe?establishmentId=${encodeURIComponent(establishmentId)}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to cleanup duplicate reviews');
  }
  
  return response.json();
}