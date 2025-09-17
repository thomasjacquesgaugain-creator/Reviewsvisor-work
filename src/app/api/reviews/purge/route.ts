export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://zzjmtipdsccxmmoaetlp.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { 
    auth: { 
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    } 
  }
);

async function resolveCandidates(inputId: string) {
  // On récupère l'id interne et place_id à partir d'un id ou d'un place_id
  const candidates = new Set<string>([inputId]);
  
  const { data: est1 } = await supabaseAdmin
    .from("establishments")
    .select("id, place_id")
    .or(`id.eq.${inputId},place_id.eq.${inputId}`)
    .limit(1);

  if (est1 && est1.length) {
    candidates.add(est1[0].id);
    if (est1[0].place_id) candidates.add(est1[0].place_id);
  }
  
  return Array.from(candidates);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawId = body?.establishmentId as string | undefined;
    
    if (!rawId) {
      return Response.json({ error: "establishmentId requis" }, { status: 400 });
    }

    const candidates = await resolveCandidates(rawId);

    // Compter avant suppression pour renvoyer un total fiable
    const { count: toDeleteCount, error: countErr } = await supabaseAdmin
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .in("place_id", candidates);
      
    if (countErr) {
      console.error("Count error:", countErr);
      throw countErr;
    }

    // Supprimer toutes les lignes correspondantes (place_id dans les candidats)
    const { error: delErr } = await supabaseAdmin
      .from("reviews")
      .delete()
      .in("place_id", candidates);
      
    if (delErr) {
      console.error("Delete error:", delErr);
      throw delErr;
    }

    return Response.json({ deleted: toDeleteCount ?? 0, candidates });
    
  } catch (err: any) {
    console.error("PURGE ERROR", err);
    return Response.json({ error: err?.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const establishmentId = searchParams.get("establishmentId");
  
  const fake = new Request(req.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ establishmentId }),
  });
  
  return POST(fake);
}