import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;
const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')!;
const YELP_API_KEY = Deno.env.get('YELP_API_KEY') || '';
const USE_YELP = (Deno.env.get('REVIEWS_USE_YELP') || 'false').toLowerCase() === 'true';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
// IMPORTANT: service role pour bypass RLS côté serveur (ne JAMAIS exposer côté client)
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type Input = { place_id: string; name?: string; address?: string; __ping?: boolean };

async function fetchGoogleReviews(place_id: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', place_id);
  url.searchParams.set('fields', 'rating,user_ratings_total,reviews');
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
  
  const r = await fetch(url.toString());
  const j = await r.json();
  const reviews = j?.result?.reviews ?? [];
  
  return reviews.map((rv: any) => ({
    source: 'google',
    author: rv.author_name,
    rating: rv.rating,
    text: rv.text,
    reviewed_at: rv.time ? new Date(rv.time * 1000).toISOString() : null,
    raw: rv
  }));
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
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
    const input = await req.json() as { place_id: string; name?: string; address?: string, __ping?: boolean };

    // mode ping (diagnostic sécurisé)
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

    if (!input?.place_id) {
      return new Response(JSON.stringify({ error: 'missing_place_id' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // crée client service role
    const { createClient } = await import('jsr:@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    });

    console.log(`Analyzing reviews for place_id: ${input.place_id}`);

    // fetch avis (Google by place_id uniquement)
    const reviewsGoogle = await fetchGoogleReviews(input.place_id).catch((e)=>{ throw new Error('google_fetch_failed:' + e?.message); });
    const reviewsYelp = (USE_YELP && YELP_API_KEY) ? await fetchYelpReviews(input.name, input.address).catch(()=>[]) : [];
    const all = [...reviewsGoogle, ...reviewsYelp];
    console.log(`Collected ${all.length} reviews (Google: ${reviewsGoogle.length}, Yelp: ${reviewsYelp.length})`);

    // insert bruts (tolérant)
    if (all.length) {
      const chunk = 500;
      for (let i=0;i<all.length;i+=chunk) {
        const slice = all.slice(i,i+chunk).map(r => ({
          place_id: input.place_id,
          source: r.source, author: r.author ?? null, rating: r.rating ?? null, text: r.text ?? null,
          reviewed_at: r.reviewed_at ?? null, raw: r.raw ?? null
        }));
        await supabase.from('reviews_raw').insert(slice).catch(()=>({})); // best effort
      }
    }

    // analyse IA
    const insights = await analyzeWithAI(all);
    console.log('AI analysis completed:', insights);

    const up = await supabase.from('review_insights').upsert({
      place_id: input.place_id,
      summary: insights,
      last_analyzed_at: new Date().toISOString()
    }).select().single();
    if (up.error) throw new Error('upsert_failed:' + up.error.message);

    return new Response(JSON.stringify({
      ok: true,
      counts: { collected: all.length },
      source_flags: { google: true, yelp: USE_YELP && !!YELP_API_KEY }
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('Error in analyze-reviews:', e);
    return new Response(JSON.stringify({ ok:false, error: String(e?.message || e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});