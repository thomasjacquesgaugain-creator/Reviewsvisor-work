export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";
import { makeFingerprint } from "@/lib/reviews/dedupe";

const admin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!, { auth: { persistSession: false } });

// chunk util
function chunk<T>(arr: T[], size = 500) { const res:T[][]=[]; for (let i=0;i<arr.length;i+=size) res.push(arr.slice(i,i+size)); return res; }

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { establishmentId, items } = body || {};
    if (!establishmentId || !Array.isArray(items) || !items.length) {
      return new Response(JSON.stringify({ error: "Paramètres manquants" }), { status: 400 });
    }

    // Fingerprints + filtrage basique
    const prepared = items.map((it: any) => ({
      place_id: establishmentId,
      user_id: it.user_id, // will be set by the frontend
      author: it.author?.trim() || "Anonyme",
      rating: Number(it.rating) || 0,
      text: (it.comment || "").trim() || null,
      source: it.platform || "manual",
      source_review_id: it.source_review_id || `manual_${Date.now()}_${Math.random()}`,
      published_at: it.review_date ? new Date(it.review_date).toISOString() : null,
      fingerprint: makeFingerprint({
        platform: it.platform || "manual",
        author: it.author || "Anonyme",
        rating: Number(it.rating) || 0,
        comment: it.comment || "",
        review_date: it.review_date || null,
      }),
    })).filter((r: any) => r.rating >= 1 && r.rating <= 5);

    // Récup des fingerprints existants pour l'établissement
    const fps = prepared.map((p:any) => p.fingerprint);
    const { data: existing } = await admin
      .from("reviews")
      .select("fingerprint")
      .eq("place_id", establishmentId)
      .in("fingerprint", fps);

    const existingSet = new Set((existing || []).map((e:any) => e.fingerprint));

    // à insérer = non présents
    const toInsert = prepared.filter((p:any) => !existingSet.has(p.fingerprint));

    let inserted = 0;
    for (const part of chunk(toInsert, 500)) {
      const { data, error } = await admin.from("reviews").insert(part).select("id");
      if (error) throw error;
      inserted += data?.length ?? 0;
    }

    return new Response(JSON.stringify({
      total_detected: items.length,
      inserted,
      duplicates: items.length - inserted,
      invalid: items.length - prepared.length,
    }), { 
      headers: { "Content-Type": "application/json" }
    });
  } catch (e:any) {
    console.error("BULK IMPORT ERROR", e);
    return new Response(JSON.stringify({ error: e?.message || "Erreur serveur" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}