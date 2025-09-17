import { supabase } from "@/integrations/supabase/client";
import crypto from "crypto";

interface ReviewCreate {
  establishmentId: string;
  platform: string;
  authorFirstName: string | null;
  authorLastName: string | null;
  rating: number;
  comment: string;
  reviewDate?: string | null;
  import_method: string;
  raw_fingerprint?: string | null;
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

const norm = (s?: string) => (s || "").trim().replace(/\s+/g, " ").toLowerCase();

function sha1Hex(s: string): string {
  return crypto.createHash("sha1").update(s).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = body.reviews || [];

    if (!Array.isArray(input) || input.length === 0) {
      return Response.json({ error: "No reviews provided" }, { status: 400 });
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reasons = {
      duplicate: 0,
      missingRating: 0,
      missingEstablishment: 0
    };
    const sampleSkipped: Array<{ reason: string; snippet: string }> = [];

    // Process and validate reviews
    const processedReviews: Array<ReviewCreate & { dedupKey: string }> = [];
    
    for (const r of input) {
      if (!r.establishmentId || !Number.isFinite(r.rating)) { 
        reasons.missingEstablishment++;
        if (sampleSkipped.length < 5) {
          sampleSkipped.push({
            reason: 'missing_establishment',
            snippet: `${r.authorFirstName || 'Anonyme'}: ${(r.comment || '').substring(0, 50)}...`
          });
        }
        continue;
      }

      if (r.rating < 1 || r.rating > 5) {
        reasons.missingRating++;
        if (sampleSkipped.length < 5) {
          sampleSkipped.push({
            reason: 'missing_rating',
            snippet: `${r.authorFirstName || 'Anonyme'}: ${(r.comment || '').substring(0, 50)}...`
          });
        }
        continue;
      }

      // Generate dedupKey
      let dedupKey: string;
      if (r.import_method === "paste" && r.raw_fingerprint) {
        dedupKey = sha1Hex(`${r.establishmentId}|${norm(r.raw_fingerprint)}`);
      } else {
        dedupKey = sha1Hex([
          r.establishmentId,
          norm(r.authorFirstName) + " " + norm(r.authorLastName),
          String(r.rating),
          norm(r.comment),
          String(r.reviewDate || ""),
          norm(r.platform || "")
        ].join("|"));
      }

      // Ensure comment is not null
      if (r.comment == null) r.comment = "";

      processedReviews.push({ ...r, dedupKey });
    }

    if (processedReviews.length === 0) {
      return Response.json({ 
        inserted: 0, 
        skipped: input.length,
        reasons,
        sampleSkipped
      });
    }

    // Check for existing dedupKeys to filter duplicates BEFORE insertion
    const dedupKeys = processedReviews.map(r => r.dedupKey);
    const { data: existingReviews } = await supabase
      .from('reviews')
      .select('dedup_key')
      .eq('user_id', user.id)
      .eq('place_id', processedReviews[0].establishmentId)
      .in('dedup_key', dedupKeys);

    const existingKeys = new Set(existingReviews?.map(r => r.dedup_key) || []);
    const toCreate = processedReviews.filter(r => !existingKeys.has(r.dedupKey));
    
    // Count duplicates found during pre-filtering
    const duplicatesCount = processedReviews.length - toCreate.length;
    reasons.duplicate = duplicatesCount;
    
    // Add duplicate samples
    for (const review of processedReviews) {
      if (existingKeys.has(review.dedupKey) && sampleSkipped.length < 5) {
        sampleSkipped.push({
          reason: 'duplicate',
          snippet: `${review.authorFirstName || 'Anonyme'}: ${(review.comment || '').substring(0, 50)}...`
        });
      }
    }

    if (toCreate.length === 0) {
      return Response.json({ 
        inserted: 0, 
        skipped: input.length,
        reasons,
        sampleSkipped
      });
    }

    // Bulk insert only unique reviews
    const reviewsToInsert = toCreate.map(review => {
      // Parse review date safely
      let publishedAt: string | null = null;
      if (review.reviewDate) {
        try {
          const date = new Date(review.reviewDate);
          if (!isNaN(date.getTime()) && review.reviewDate !== 'Invalid Date') {
            publishedAt = date.toISOString();
          }
        } catch (e) {
          // Invalid date, keep null
        }
      }

      return {
        user_id: user.id,
        place_id: review.establishmentId,
        source: review.platform,
        author: `${review.authorFirstName || ""} ${review.authorLastName || ""}`.trim() || 'Anonyme',
        rating: review.rating,
        text: review.comment || "",
        published_at: publishedAt,
        source_review_id: review.dedupKey, // Keep for backward compatibility
        dedup_key: review.dedupKey, // New dedup_key column
        raw: {
          import_method: review.import_method,
          author_first_name: review.authorFirstName,
          author_last_name: review.authorLastName,
          raw_fingerprint: review.raw_fingerprint
        }
      };
    });

    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewsToInsert)
      .select('id');

    if (error) {
      console.error('Bulk insert error:', error);
      throw error;
    }

    const inserted = data?.length || 0;
    const result: BulkCreateResult = { 
      inserted, 
      skipped: input.length - inserted,
      reasons,
      sampleSkipped
    };

    return Response.json(result);

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
