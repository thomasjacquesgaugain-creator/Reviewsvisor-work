import { supabase } from "@/integrations/supabase/client";
import crypto from "crypto";

function normalizeText(text: string): string {
  return (text || "").trim().replace(/\s+/g, " ").toLowerCase();
}

function generateDedupKey(review: any): string {
  const rawData = review.raw as any;
  
  if (rawData?.import_method === "paste" && rawData?.raw_fingerprint) {
    return crypto
      .createHash("sha1")
      .update(`${review.place_id}|${rawData.raw_fingerprint}`)
      .digest("hex");
  }
  
  // Fallback for other imports
  const authorName = review.author || "";
  const parts = [
    review.place_id,
    normalizeText(authorName),
    String(review.rating || ""),
    normalizeText(review.text || ""),
    String(review.published_at || ""),
    normalizeText(review.source || "")
  ];
  
  return crypto
    .createHash("sha1")
    .update(parts.join("|"))
    .digest("hex");
}

export async function POST(request: Request) {
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

    // Step 1: Update missing dedup_key values
    const { data: reviewsWithoutDedup, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('place_id', establishmentId)
      .is('dedup_key', null);

    if (fetchError) {
      console.error('Error fetching reviews:', fetchError);
      return Response.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    let updatedKeys = 0;
    
    if (reviewsWithoutDedup && reviewsWithoutDedup.length > 0) {
      for (const review of reviewsWithoutDedup) {
        const dedupKey = generateDedupKey(review);
        
        const { error: updateError } = await supabase
          .from('reviews')
          .update({ dedup_key: dedupKey })
          .eq('id', review.id);
        
        if (!updateError) {
          updatedKeys++;
        }
      }
    }

    // Step 2: Remove duplicates (keep oldest)
    const { data: duplicatesData, error: duplicatesError } = await supabase
      .rpc('identify_duplicate_reviews', {
        p_place_id: establishmentId,
        p_user_id: user.id
      });

    let deletedDupes = 0;
    
    if (!duplicatesError && duplicatesData) {
      // The RPC function should return IDs of duplicate reviews to delete
      for (const duplicateId of duplicatesData) {
        const { error: deleteError } = await supabase
          .from('reviews')
          .delete()
          .eq('id', duplicateId);
        
        if (!deleteError) {
          deletedDupes++;
        }
      }
    }

    return Response.json({
      updatedKeys,
      deletedDupes,
      message: `Updated ${updatedKeys} dedup keys and removed ${deletedDupes} duplicates`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
