import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
)

// Simple hash for fingerprinting
function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return "h" + (h >>> 0).toString(16);
}

// Normalize text for fingerprinting
function norm(s: string): string {
  return (s || "").toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .trim();
}

// Generate fingerprint for deduplication
function makeFingerprint(item: {
  platform: string;
  author: string;
  rating: number;
  comment?: string;
  review_date?: string | null;
}): string {
  const p = norm(item.platform);
  const a = norm(item.author);
  const r = String(item.rating || 0);
  const c = norm(item.comment || "");
  let d = "";
  
  if (item.review_date) {
    const dt = new Date(item.review_date);
    if (!isNaN(dt.getTime())) {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const day = String(dt.getUTCDate()).padStart(2, "0");
      d = `${y}-${m}-${day}`;
    }
  }
  
  const base = c ? `${p}|${a}|${r}|${c}` : `${p}|${a}|${r}|${d}`;
  return simpleHash(base);
}

// Chunk array into smaller arrays
function chunk<T>(arr: T[], size = 500): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { establishmentId, items, user_id } = await req.json();
    
    if (!establishmentId || !Array.isArray(items) || !items.length || !user_id) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants (establishmentId, items, user_id)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${items.length} items for establishment ${establishmentId}`);

    // Prepare and validate reviews
    const prepared = items.map((item: any) => ({
      place_id: establishmentId,
      user_id: user_id,
      author: item.author?.trim() || "Anonyme",
      rating: Number(item.rating) || 0,
      text: (item.comment || "").trim() || null,
      source: item.platform || "manual",
      source_review_id: item.source_review_id || `manual_${Date.now()}_${Math.random()}`,
      published_at: item.review_date ? new Date(item.review_date).toISOString() : null,
      fingerprint: makeFingerprint({
        platform: item.platform || "manual",
        author: item.author || "Anonyme",
        rating: Number(item.rating) || 0,
        comment: item.comment || "",
        review_date: item.review_date || null,
      }),
    })).filter((r: any) => r.rating >= 1 && r.rating <= 5);

    console.log(`Prepared ${prepared.length} valid reviews`);

    // Get existing fingerprints for this establishment and user
    const fps = prepared.map((p: any) => p.fingerprint);
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("reviews")
      .select("fingerprint")
      .eq("place_id", establishmentId)
      .eq("user_id", user_id)
      .in("fingerprint", fps);

    if (existingError) {
      console.error("Error checking existing fingerprints:", existingError);
      throw existingError;
    }

    const existingSet = new Set((existing || []).map((e: any) => e.fingerprint));
    const toInsert = prepared.filter((p: any) => !existingSet.has(p.fingerprint));

    console.log(`${toInsert.length} new reviews to insert, ${prepared.length - toInsert.length} duplicates`);

    let inserted = 0;
    
    // Insert in chunks to avoid timeouts
    for (const part of chunk(toInsert, 500)) {
      const { data, error } = await supabaseAdmin
        .from("reviews")
        .insert(part)
        .select("id");
      
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
      
      inserted += data?.length ?? 0;
    }

    console.log(`Successfully inserted ${inserted} reviews`);

    return new Response(
      JSON.stringify({
        total_detected: items.length,
        inserted,
        duplicates: items.length - inserted,
        invalid: items.length - prepared.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Bulk import error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Erreur serveur" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});