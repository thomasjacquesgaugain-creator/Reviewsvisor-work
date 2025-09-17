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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get("establishmentId") || "";
    if (!rawId) {
      return Response.json({ error: "establishmentId requis" }, { status: 400 });
    }

    const candidates = await resolveCandidates(rawId);
    const results: any[] = [];

    for (const table of TABLES) {
      for (const col of COLS) {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select("id", { count: "exact", head: true })
          .in(col, candidates);
        if (error) {
          results.push({ table, col, error: error.message });
        } else {
          results.push({ table, col, count: count ?? 0 });
        }
      }
    }

    // Échantillon des 5 premières valeurs distinctes trouvées pour aider au debug
    const samples: Record<string, any> = {};
    for (const table of TABLES) {
      const { data } = await supabaseAdmin
        .from(table)
        .select("establishment_id, establishmentId, etablissement_id, etablissementId, place_id")
        .limit(5);
      samples[table] = data ?? [];
    }

    return Response.json({ establishmentId: rawId, candidates, results, samples });
  } catch (e: any) {
    console.error("Inspect error:", e);
    return Response.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}