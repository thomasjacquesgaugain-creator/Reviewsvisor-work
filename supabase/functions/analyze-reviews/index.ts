import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
} as const;

const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')!;
const YELP_API_KEY = Deno.env.get('YELP_API_KEY') || '';
const USE_YELP = (Deno.env.get('REVIEWS_USE_YELP') || 'false').toLowerCase() === 'true';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// IMPORTANT: service role pour bypass RLS côté serveur (ne JAMAIS exposer côté client)
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Input = { place_id: string; name?: string; address?: string; __ping?: boolean };

async function fetchGoogleReviews(place_id: string) {
  // Essaye 2 variantes d'URL : /v1/places/{id} puis /v1/places/places/{id}
  const fieldMask = 'rating,userRatingCount,reviews';
  async function tryFetch(pathVariant: 'plain' | 'withPrefix') {
    const path = pathVariant === 'plain'
      ? `https://places.googleapis.com/v1/places/${encodeURIComponent(place_id)}`
      : `https://places.googleapis.com/v1/places/places/${encodeURIComponent(place_id)}`;

    const r = await fetch(path, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fieldMask,
      },
    });
    const text = await r.text();
    let j: any = null; try { j = JSON.parse(text); } catch {}
    return { ok: r.ok, status: r.status, body: j ?? text, json: j, url: path };
  }

  // 1er essai
  let res = await tryFetch('plain');
  // fallback si 400/404/INVALID_ARGUMENT
  const invalid =
    !res.ok &&
    (res.status === 400 || res.status === 404 ||
     (typeof res.body === 'object' && res.body?.error?.status === 'INVALID_ARGUMENT'));
  if (invalid) res = await tryFetch('withPrefix');

  if (!res.ok) {
    const code = (res.body && res.body.error && res.body.error.status) || res.status || 'UNKNOWN';
   const msg = (res.body && res.body.error && res.body.error.message) || JSON.stringify(res.body);
    throw new Error(`google_v1_http_${code}: ${msg}`);
  }

  const j = res.json || {};
  const reviews = j?.reviews ?? [];
  return {
    meta: {
      rating: j?.rating ?? null,
      total: j?.userRatingCount ?? null, // v1: userRatingCount
      usedUrl: res.url,
    },
    rows: reviews.map((rv: any) => ({
      source: 'google',
      author: rv?.authorAttribution?.displayName ?? null,
      rating: rv?.rating ?? null,
      text: rv?.originalText?.text ?? rv?.text ?? null,
      reviewed_at: rv?.publishTime ? new Date(rv.publishTime).toISOString() : null,
      raw: rv,
    })),
    raw: j,
  };
}

async function fetchYelpReviews(name?: string, address?: string) {
  if (!YELP_API_KEY || !name || !address) return [];
  
  try {
    const params = new URLSearchParams({ term: name, location: address });
    const r1 = await fetch('https://api.yelp.com/v3/businesses/search?' + params.toString(), {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
    });
    const j1 = await r1.json();
    const id = j1?.businesses?.[0]?.id;
    if (!id) return [];
    
    const r2 = await fetch(`https://api.yelp.com/v3/businesses/${id}/reviews`, {
      headers: { Authorization: `Bearer ${YELP_API_KEY}` },
    });
    const j2 = await r2.json();
    const reviews = j2?.reviews ?? [];
    
    return reviews.map((rv: any) => ({
      source: 'yelp',
      author: rv.user?.name,
      rating: rv.rating,
      text: rv.text,
      reviewed_at: rv.time_created ? new Date(rv.time_created).toISOString() : null,
      raw: rv
    }));
  } catch (error) {
    console.error('Yelp API error:', error);
    return [];
  }
}

async function analyzeWithAI(reviews: { rating?: number; text?: string }[]) {
  const chunks: string[] = [];
  let buffer = '';
  
  for (const r of reviews) {
    const line = `- (${r.rating ?? 'NA'}/5) ${r.text?.replaceAll('\n',' ').slice(0,600)}`;
    if ((buffer + '\n' + line).length > 12000) {
      chunks.push(buffer); 
      buffer = line;
    } else {
      buffer += '\n' + line;
    }
  }
  if (buffer) chunks.push(buffer);

  const insights = { 
    counts: { total: reviews.length }, 
    top_issues: [] as any[], 
    top_strengths: [] as any[], 
    recommendations: [] as any[], 
    overall_rating: null as number | null, 
    positive_pct: null as number | null, 
    negative_pct: null as number | null 
  };

  for (const chunk of chunks) {
    const prompt = `Tu es analyste d'avis clients pour la restauration.
Voici un lot d'avis (notation sur 5 quand dispo).
Dégage:
- note moyenne approximative
- % positifs vs négatifs (approx)
- 3 problèmes prioritaires (avec raison brève)
- 3 points forts majeurs
- 5 recommandations actionnables et concrètes
Réponds en JSON strict: {
  "avg": number, "pos_pct": number, "neg_pct": number,
  "issues": [{"label": string, "why": string}],
  "strengths": [{"label": string, "why": string}],
  "reco": [string]
}
Avis:
${chunk}`;

    try {
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${OPENAI_API_KEY}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          model: 'gpt-5-2025-08-07',
          messages: [{ role: 'user', content: prompt }],
          max_completion_tokens: 1000,
        })
      });
      
      const j = await r.json();
      const txt = j?.choices?.[0]?.message?.content ?? '{}';
      let pj;
      try { 
        pj = JSON.parse(txt); 
      } catch { 
        continue; 
      }
      
      // agrégation naïve
      if (typeof pj.avg === 'number') {
        insights.overall_rating = (insights.overall_rating ?? pj.avg) * 0.5 + pj.avg * 0.5;
      }
      if (typeof pj.pos_pct === 'number') {
        insights.positive_pct = (insights.positive_pct ?? pj.pos_pct) * 0.5 + pj.pos_pct * 0.5;
      }
      if (typeof pj.neg_pct === 'number') {
        insights.negative_pct = (insights.negative_pct ?? pj.neg_pct) * 0.5 + pj.neg_pct * 0.5;
      }
      insights.top_issues.push(...(pj.issues ?? []));
      insights.top_strengths.push(...(pj.strengths ?? []));
      insights.recommendations.push(...(pj.reco ?? []));
    } catch (error) {
      console.error('OpenAI API error:', error);
    }
  }

  // dédup & top 3
  function top3(arr: any[], key='label') {
    const map = new Map<string, any & {count:number}>();
    for (const a of arr) {
      const k = (a?.[key] || '').toLowerCase();
      if (!k) continue;
      const cur = map.get(k) || { ...a, count: 0 };
      cur.count++; 
      cur.why ||= a.why;
      map.set(k, cur);
    }
    return Array.from(map.values())
      .sort((a,b)=>b.count-a.count)
      .slice(0,3)
      .map(({count, ...rest})=>rest);
  }
  
  const uniqRecos = Array.from(new Set(insights.recommendations)).slice(0,5);
  
  return {
    overall_rating: insights.overall_rating ? Number(insights.overall_rating.toFixed(2)) : null,
    positive_pct: insights.positive_pct ? Math.round(insights.positive_pct) : null,
    negative_pct: insights.negative_pct ? Math.round(insights.negative_pct) : null,
    counts: insights.counts,
    top_issues: top3(insights.top_issues),
    top_strengths: top3(insights.top_strengths),
    recommendations: uniqRecos
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const input = await req.json() as { place_id: string; name?: string; address?: string; __ping?: boolean; __dryRun?: boolean; __debug?: boolean };

    if (input.__ping) {
      return new Response(JSON.stringify({
        ok: true,
        env: {
          OPENAI_API_KEY: !!OPENAI_API_KEY,
          GOOGLE_PLACES_API_KEY: !!GOOGLE_PLACES_API_KEY,
          SUPABASE_URL: !!supabaseUrl,
          SUPABASE_SERVICE_ROLE_KEY: !!serviceRoleKey,
          USE_YELP: USE_YELP && !!YELP_API_KEY,
        }
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!input?.place_id) return new Response(JSON.stringify({ error: 'missing_place_id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const authHeader = req.headers.get('Authorization') || '';
    let userId: string | null = null;
    try {
      if (authHeader.startsWith('Bearer ')) {
        const { createClient } = await import('jsr:@supabase/supabase-js');
        const authClient = createClient(supabaseUrl, SUPABASE_ANON_KEY, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await authClient.auth.getUser();
        userId = user?.id ?? null;
      }
    } catch {}

    const logs: any[] = [];
    function log(step: string, data?: any) { if (input.__debug) logs.push({ step, data }); }

    const { createClient } = await import('jsr:@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // 1) Google (strict place_id)
    log('google_fetch_start', { place_id: input.place_id });
    const g = await fetchGoogleReviews(input.place_id);
    log('google_fetch_ok', { meta: g.meta, count: g.rows.length });
    log('google_meta', { meta: g.meta });

    // 2) Yelp (off par défaut)
    let yRows: any[] = [];
    if (USE_YELP && YELP_API_KEY) {
      log('yelp_fetch_start', { name: input.name, address: input.address });
      yRows = await fetchYelpReviews(input.name, input.address).catch((e)=>{ log('yelp_fetch_err', String(e)); return []; });
      log('yelp_fetch_ok', { count: yRows.length });
    }

    const all = [...g.rows, ...yRows];
    log('collect_done', { total: all.length });

    // 3) Insert bruts (sauf en dry-run)
    if (!input.__dryRun && all.length) {
      const chunk = 500;
      for (let i=0;i<all.length;i+=chunk) {
        const slice = all.slice(i,i+chunk).map(r => ({
          place_id: input.place_id,
          user_id: userId,
          source: r.source, author: r.author ?? null, rating: r.rating ?? null, text: r.text ?? null,
          reviewed_at: r.reviewed_at ?? null, raw: r.raw ?? null
        }));
        const ins = await supabase.from('reviews_raw').insert(slice);
        if (ins.error) log('insert_err', ins.error.message);
      }
      log('insert_done');
    } else {
      log('insert_skipped', { dryRun: true });
    }

    // 4) Analyse IA (sauf si aucun avis)
    let insights: any = null;
    if (all.length) {
      insights = await analyzeWithAI(all);
      log('ai_done', { summary: { ...insights, recommendations: (insights?.recommendations||[]).slice(0,2) } });
    } else {
      log('ai_skipped_no_reviews');
    }

   // 5) Upsert insights (sauf dry-run)
    if (!input.__dryRun && insights) {
      const payload: any = {
        place_id: input.place_id,
        summary: insights ?? {},
        last_analyzed_at: new Date().toISOString()
      };
      if (userId) payload.user_id = userId;

      const up = await supabase.from('review_insights').upsert(payload).select().single();
      if (up.error) throw new Error('upsert_failed:' + up.error.message);
      log('upsert_done');
    } else {
      log('upsert_skipped', { dryRun: true });
    }

    return new Response(JSON.stringify({
      ok: true,
      counts: { collected: all.length, google: g.rows.length, yelp: yRows.length },
      google_meta: g.meta,
      dryRun: !!input.__dryRun,
      logs: input.__debug ? logs : undefined
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('Error in analyze-reviews:', e);
    return new Response(JSON.stringify({ ok:false, error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});