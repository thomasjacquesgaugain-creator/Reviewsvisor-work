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

async function resolveEstablishmentId(inputId: string) {
  // Tente id direct puis place_id
  let { data: byId } = await supabaseAdmin
    .from("establishments")
    .select("id")
    .eq("id", inputId)
    .limit(1);
  if (byId && byId.length) return byId[0].id;

  let { data: byPlace } = await supabaseAdmin
    .from("establishments")
    .select("id")
    .eq("place_id", inputId)
    .limit(1);
  if (byPlace && byPlace.length) return byPlace[0].id;

  return inputId; // fallback
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let { establishmentId } = body || {};
    
    if (!establishmentId) {
      return Response.json({ error: "establishmentId requis" }, { status: 400 });
    }

    establishmentId = await resolveEstablishmentId(establishmentId);

    // Supprime toutes les reviews pour ce place_id avec count exact
    const { data, error, count } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("place_id", establishmentId)
      .select("id");

    if (error) {
      console.error("Supabase delete error:", error);
      throw error;
    }

    return Response.json({ deleted: data?.length ?? 0 });
    
  } catch (err: any) {
    console.error("PURGE ERROR", err);
    return Response.json({ error: err?.message || "Erreur serveur" }, { status: 500 });
  }
}

// Fallback DELETE ?establishmentId=...
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