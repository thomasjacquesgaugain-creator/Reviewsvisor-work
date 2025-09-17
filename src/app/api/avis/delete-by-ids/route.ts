export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://zzjmtipdsccxmmoaetlp.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function chunk<T>(arr: T[], size = 500) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter(Boolean) : [];
    
    if (!ids.length) {
      return Response.json({ error: "Liste d'IDs vide" }, { status: 400 });
    }

    let deleted = 0;

    // Table principale : reviews
    for (const part of chunk(ids, 500)) {
      const { data, error } = await supabaseAdmin
        .from("reviews")
        .delete()
        .in("id", part)
        .select("id");
      if (error) throw error;
      deleted += data?.length ?? 0;
    }

    // Optionnel: si aucun supprimé, tenter table alternative 'avis'
    if (deleted === 0) {
      for (const part of chunk(ids, 500)) {
        try {
          const { data, error } = await supabaseAdmin
            .from("avis")
            .delete()
            .in("id", part)
            .select("id");
          if (error) throw error;
          deleted += data?.length ?? 0;
        } catch (altError) {
          console.log("Table 'avis' not found or error:", altError);
        }
      }
    }

    return Response.json({ deleted });
  } catch (e: any) {
    console.error("DELETE-BY-IDS ERROR", e);
    return Response.json({ error: e?.message || "Erreur serveur" }, { status: 500 });
  }
}