import { supabase } from "@/integrations/supabase/client";
import crypto from "crypto";

interface ReviewCreate {
  establishment_id: string;
  establishment_place_id: string;
  establishment_name: string;
  source: string;
  author_first_name: string;
  author_last_name: string;
  rating: number;
  comment: string;
  review_date?: string | null;
  import_method: string;
  import_source_url?: string | null;
  raw_fingerprint?: string;
}

interface BulkCreateResult {
  inserted: number;
  skipped: number;
  reasons: {
    duplicate?: number;
    missingRating?: number;
    missingEstablishment?: number;
  };
  sampleSkipped?: Array<{
    reason: string;
    snippet: string;
  }>;
}

function normalizeText(text: string): string {
  return (text || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function generateDedupKey(review: ReviewCreate): string {
  if (review.import_method === "paste" && review.raw_fingerprint) {
    return crypto
      .createHash("sha1")
      .update(`${review.establishment_place_id}|${review.raw_fingerprint}`)
      .digest("hex");
  }
  
  // Fallback for CSV/auto imports
  const parts = [
    review.establishment_place_id,
    normalizeText(review.author_first_name) + " " + normalizeText(review.author_last_name),
    String(review.rating),
    normalizeText(review.comment),
    String(review.review_date || ""),
    normalizeText(review.source || "")
  ];
  
  return crypto
    .createHash("sha1")
    .update(parts.join("|"))
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const reviews: ReviewCreate[] = body.reviews || [];

    if (!Array.isArray(reviews) || reviews.length === 0) {
      return Response.json({ error: "No reviews provided" }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let inserted = 0;
    const reasons = {
      duplicate: 0,
      missingRating: 0,
      missingEstablishment: 0
    };
    const sampleSkipped: Array<{ reason: string; snippet: string }> = [];

    for (const review of reviews) {
      try {
        // Validate required fields
        if (!review.establishment_place_id) {
          reasons.missingEstablishment++;
          if (sampleSkipped.length < 5) {
            sampleSkipped.push({
              reason: 'missing_establishment',
              snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
            });
          }
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
          continue;
        }

        // Generate dedup key
        const dedupKey = generateDedupKey(review);
        
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
        
        // Insert new review with dedup_key
        const { error } = await supabase
          .from('reviews')
          .insert({
            user_id: user.id,
            place_id: review.establishment_place_id,
            source: review.source,
            author: `${review.author_first_name} ${review.author_last_name}`.trim() || 'Anonyme',
            rating: review.rating,
            text: review.comment || "",
            published_at: publishedAt,
            source_review_id: dedupKey, // Keep existing field for compatibility
            dedup_key: dedupKey, // New dedicated field
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
          // Check if it's a duplicate constraint violation
          if (error.code === '23505' && error.message?.includes('ux_reviews_est_dedup')) {
            reasons.duplicate++;
            if (sampleSkipped.length < 5) {
              sampleSkipped.push({
                reason: 'duplicate',
                snippet: `${review.author_first_name || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
              });
            }
          } else {
            console.error('Error inserting review:', error);
          }
        } else {
          inserted++;
        }
      } catch (error) {
        console.error('Error processing review:', error);
      }
    }
    
    const result: BulkCreateResult = { 
      inserted, 
      skipped: reviews.length - inserted,
      reasons,
      sampleSkipped
    };

    return Response.json(result);

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
