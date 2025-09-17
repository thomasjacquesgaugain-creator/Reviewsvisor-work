export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://zzjmtipdsccxmmoaetlp.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const TABLES = ["reviews", "avis"];
const COLS = ["establishment_id", "establishmentId", "etablissement_id", "etablissementId", "place_id"];

async function resolveCandidates(inputId: string) {
  const set = new Set<string>([inputId]);
  const { data } = await supabaseAdmin
    .from("establishments")
    .select("id, place_id")
    .or(`id.eq.${inputId},place_id.eq.${inputId}`)
    .limit(1);
  if (data?.[0]) {
    set.add(data[0].id);
    if (data[0].place_id) set.add(data[0].place_id);
  }
  return Array.from(set);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawId = body?.establishmentId as string | undefined;
    if (!rawId) {
      return Response.json({ error: "establishmentId requis" }, { status: 400 });
    }

    const candidates = await resolveCandidates(rawId);

    // Compter d'abord ce qui va être supprimé (multi tables/colonnes)
    let toDelete = 0;
    for (const table of TABLES) {
      for (const col of COLS) {
        try {
          const { count } = await supabaseAdmin
            .from(table)
            .select("id", { count: "exact", head: true })
            .in(col, candidates);
          toDelete += count ?? 0;
        } catch (error) {
          // Table/colonne n'existe pas, on continue
          console.log(`Table ${table} or column ${col} doesn't exist:`, error);
        }
      }
    }

    // Supprimer pour chaque combinaison table/colonne (séquentiel pour robustesse)
    for (const table of TABLES) {
      for (const col of COLS) {
        try {
          await supabaseAdmin.from(table).delete().in(col, candidates);
        } catch (error) {
          // Table/colonne n'existe pas, on continue
          console.log(`Failed to delete from ${table}.${col}:`, error);
        }
      }
    }

    return Response.json({ deleted: toDelete, candidates });
  } catch (e: any) {
    console.error("PURGE ERROR", e);
    return Response.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const establishmentId = searchParams.get("establishmentId");
  const fake = new Request(req.url, { 
    method: "POST", 
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ establishmentId }) 
  });
  return POST(fake);
}