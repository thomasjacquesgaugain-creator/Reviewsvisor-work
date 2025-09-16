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