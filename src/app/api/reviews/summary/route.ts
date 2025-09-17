export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { createClient } from "@supabase/supabase-js";

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
);

async function getSummary(establishmentId: string) {
  // total exact
  const { count: total } = await admin
    .from("reviews")
    .select("id", { head: true, count: "exact" })
    .eq("establishment_id", establishmentId);

  // moyenne (si on garde la colonne rating)
  const { data: ratings } = await admin
    .from("reviews")
    .select("rating")
    .eq("establishment_id", establishmentId)
    .limit(10000);

  let avg = null as number | null;
  if (ratings?.length) {
    const sum = ratings.reduce((s, r) => s + (Number(r.rating) || 0), 0);
    avg = Math.round((sum / ratings.length) * 10) / 10;
  }
  return { totalAll: total ?? 0, avgRating: avg };
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("establishmentId");
  if (!id) return Response.json({ error: "establishmentId requis" }, { status: 400 });

  const data = await getSummary(id);
  return Response.json(data, {
    headers: {
      "Cache-Control": "no-store, max-age=0, must-revalidate",
      "CDN-Cache-Control": "no-store",
      "Vercel-CDN-Cache-Control": "no-store"
    }
  });
}