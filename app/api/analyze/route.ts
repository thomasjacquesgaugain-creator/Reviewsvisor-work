export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const urlBase =
      (process.env.NEXT_PUBLIC_SUPABASE_URL ||
       process.env.SUPABASE_URL ||
       '').replace(/\/$/, '');
    const anon =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!urlBase || !anon) {
      return new Response(
        JSON.stringify({ error: 'Server ENV missing: SUPABASE_URL/ANON_KEY' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

   const r = await fetch(`${urlBase}/functions/v1/analyze_reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon as string,
        authorization: `Bearer ${anon}`,
      },
      body: JSON.stringify({ __debug: true, ...body }),
    });

    const text = await r.text();
    return new Response(text, {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}