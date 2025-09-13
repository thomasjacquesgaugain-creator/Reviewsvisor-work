import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Helpers ENV (Deno) + CORS + JSON
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
};
const json = (body: any, status = 200) =>
  new Response(JSON.stringify(body ?? {}), { status, headers: corsHeaders });

const env = (k: string, required = false) => {
  const v = Deno.env.get(k);
  if (required && (!v || v.length === 0)) throw new Error(`env_missing:${k}`);
  return v ?? '';
};

const SUPABASE_URL = env('SUPABASE_URL', true);
const SERVICE_ROLE = env('SUPABASE_SERVICE_ROLE_KEY', true);
const OPENAI_API_KEY = env('OPENAI_API_KEY');
const GOOGLE_PLACES_API_KEY = env('GOOGLE_PLACES_API_KEY');
const USE_YELP = env('USE_YELP') === 'true';

// Client admin pour DB (pas besoin d'Authorization côté requête)
const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

type Review = {
  source: 'google'|'yelp';
  source_ref?: string;
  author?: string;
  rating?: number;
  text?: string;
  url?: string;
  created_at?: string; // ISO
};

const toHex = (buf:ArrayBuffer)=>[...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
async function hashReview(r:Review, place_id:string){
  const key = `${place_id}|${r.source}|${(r.author??'').trim()}|${(r.text??'').trim()}|${r.created_at??''}`;
  const buf = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  return toHex(digest);
}

function avg(nums: number[]) { return nums.length ? nums.reduce((a,b)=>a+b,0) / nums.length : null; }
function pct(part: number, total: number) { return total ? Math.round((part/total)*100) : null; }

// Mots vides FR/EN très simples
const STOP = new Set(['le','la','les','un','une','des','de','du','au','aux','et','ou','mais','donc','or','ni','car','en','dans','sur','avec','pour','par','pas','plus','moins','tres','très','est','cest','ce','ça','sa','son','ses','se','sur','the','a','an','and','or','but','for','to','of','in','on','at','is','it','this','that','was','were','are','be','been','very','not','no','yes','i','you','we','they','he','she','my','your','their']);

function normalizeText(t: string) {
  return t
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'') // enlever accents
    .replace(/[^a-z0-9\s]+/g,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function topKeywords(texts: string[], k = 5) {
  const freq = new Map<string, number>();
  for (const t of texts) {
    const norm = normalizeText(t || '');
    for (const w of norm.split(' ')) {
      if (!w || w.length < 3 || STOP.has(w)) continue;
      freq.set(w, (freq.get(w)||0) + 1);
    }
  }
  return [...freq.entries()]
    .sort((a,b)=>b[1]-a[1])
    .slice(0, k)
    .map(([label]) => ({ label }));
}

function deriveRecommendations(issues: {label:string}[]) {
  const rec: string[] = [];
  const L = issues.map(i=>i.label);
  const has = (s:string)=>L.some(x=>x.includes(s));
  if (has('attente') || has('wait')) rec.push("Réduire le temps d'attente : optimiser le service aux heures de pointe et afficher les délais.");
  if (has('prix') || has('price')) rec.push("Revoir la politique tarifaire et proposer des offres claires.");
  if (has('service') || has('accueil') || has('staff')) rec.push("Former le personnel à l'accueil et à la résolution des problèmes.");
  if (has('qualite') || has('quality')) rec.push("Standardiser la qualité des produits/prestations et contrôler régulièrement.");
  if (!rec.length) rec.push("Demander des retours ciblés aux clients et traiter les points récurrents en priorité.");
  return rec.slice(0,5);
}

// Fallback "statistiques + règles"
function analyzeFallback(all: any[]) {
  const ratings = all.map(r=> Number(r.rating)).filter(n=>!Number.isNaN(n) && n>0);
  const texts = all.map(r=> (r.text || '').toString()).filter(Boolean);
  const positives = all.filter(r=> Number(r.rating) >= 4).length;
  const negatives = all.filter(r=> Number(r.rating) <= 2).length;
  const total = all.length;

  const kw = topKeywords(texts, 8);
  // Heuristique : mots-clés "problèmes" vs "forces"
  const issueHints = ['attente','retard','lente','lent','prix','cher','sale','froid','bruit','bruyant','service','accueil','erreur','erreurs','wrong','slow','dirty','cold','loud','expensive','rude','mistake'];
  const strengthHints = ['qualite','propre','rapide','sympa','accueil','chaleureux','bon','bonne','delicieux','delicieuse','cosy','calme','friendly','clean','fast','tasty','great','nice','warm','quiet'];
  const issues = kw.filter(k => issueHints.some(h=>k.label.includes(h))).slice(0,3);
  const strengths = kw.filter(k => strengthHints.some(h=>k.label.includes(h))).slice(0,3);

  return {
    overall_rating: ratings.length ? Number(avg(ratings)?.toFixed(2)) : null,
    positive_pct: pct(positives, total),
    negative_pct: pct(negatives, total),
    counts: { total },
    top_issues: issues,
    top_strengths: strengths,
    recommendations: deriveRecommendations(issues),
  };
}

async function analyzeWithAIorFallback(all: any[], metaRating: number | null) {
  // essaie l'IA si dispo ; sinon fallback
  try {
    if (!OPENAI_API_KEY) throw new Error('no_openai_key');
    const base = analyzeFallback(all); // stats de base garanties
    // === Appel IA optionnel pour améliorer la synthèse (JSON attendu) ===
    // Remplace par ton provider si besoin :
    const prompt = `Tu es un analyste d'avis. Retourne un JSON avec ces clés:
    overall_rating (nombre ou null),
    positive_pct (0-100 ou null),
    negative_pct (0-100 ou null),
    top_issues (array de {label}), top_strengths (array de {label}),
    recommendations (array de strings).
    Voici un échantillon d'avis (texte + note sur 5):\n` + JSON.stringify(all.slice(0,50).map(r=>({rating:r.rating,text:r.text})));

    // Exemple minimal avec fetch OpenAI compat (évite dépendances) — si ça échoue, on garde le fallback :
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role:'user', content: prompt }],
        response_format: { type: 'json_object' },
      })
    });
    if (!r.ok) throw new Error('openai_http_'+r.status);
    const j = await r.json();
    const content = j?.choices?.[0]?.message?.content;
    const ai = JSON.parse(content || '{}');
    // merge "ai" sur la base statistique
    return {
      overall_rating: ai.overall_rating ?? base.overall_rating,
      positive_pct: ai.positive_pct ?? base.positive_pct,
      negative_pct: ai.negative_pct ?? base.negative_pct,
      counts: base.counts,
      top_issues: Array.isArray(ai.top_issues) && ai.top_issues.length ? ai.top_issues.slice(0,3) : base.top_issues,
      top_strengths: Array.isArray(ai.top_strengths) && ai.top_strengths.length ? ai.top_strengths.slice(0,3) : base.top_strengths,
      recommendations: Array.isArray(ai.recommendations) && ai.recommendations.length ? ai.recommendations.slice(0,5) : base.recommendations,
    };
  } catch {
    return analyzeFallback(all);
  }
}

type Input = { place_id: string; name?: string; address?: string; __ping?: boolean };

// --- Collecteurs ---
async function collectGoogle(place_id:string):Promise<Review[]>{
  if(!GOOGLE_PLACES_API_KEY) return [];
  
  // FieldMask détaillé : noter chaque sous-champ requis
  const fieldMask = [
    'rating',
    'userRatingCount',
    'reviews.rating',
    'reviews.text',
    'reviews.originalText.text',
    'reviews.publishTime',
    'reviews.authorAttribution.displayName',
    'reviews.authorAttribution.uri'
  ].join(',');

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

  let res = await tryFetch('plain');
  const invalid =
    !res.ok &&
    (res.status === 400 || res.status === 404 ||
     (typeof res.body === 'object' && res.body?.error?.status === 'INVALID_ARGUMENT'));
  if (invalid) res = await tryFetch('withPrefix');

  if (!res.ok) {
    console.error('Google Places API error:', res.body);
    return [];
  }

  const j = res.json || {};
  const reviews = j?.reviews ?? [];
  return reviews.map((rv: any) => ({
    source: 'google' as const,
    source_ref: rv.name, // id de l'avis si dispo
    author: rv?.authorAttribution?.displayName ?? undefined,
    rating: rv?.rating,
    text: rv?.originalText?.text ?? rv?.text ?? '',
    url: rv?.authorAttribution?.uri ?? undefined,
    created_at: rv?.publishTime ?? undefined,
  }));
}

async function collectYelp(name?:string, address?:string):Promise<Review[]>{
  if(!USE_YELP || !env('YELP_API_KEY') || !name || !address) return [];
  const headers = { Authorization: `Bearer ${env('YELP_API_KEY')}` };
  
  try {
    // 1) Trouver le business
    const qs = new URLSearchParams({ term: name, location: address, limit:'1' });
    const sres = await fetch(`https://api.yelp.com/v3/businesses/search?${qs}`, { headers });
    if(!sres.ok) return [];
    const sjson = await sres.json();
    const biz = sjson.businesses?.[0];
    if(!biz?.id) return [];
    
    // 2) Récupérer les reviews (limité à 3 via l'API publique)
    const rres = await fetch(`https://api.yelp.com/v3/businesses/${biz.id}/reviews`, { headers });
    if(!rres.ok) return [];
    const rjson = await rres.json();
    const revs:any[] = rjson.reviews ?? [];
    
    return revs.map(rv=>({
      source:'yelp' as const,
      source_ref: rv.id,
      author: rv.user?.name ?? undefined,
      rating: rv.rating,
      text: rv.text ?? '',
      url: rv.url ?? undefined,
      created_at: rv.time_created ?? undefined,
    }));
  } catch (error) {
    console.error('Yelp API error:', error);
    return [];
  }
}

async function upsertRaw(place_id:string, items:Review[]){
  for(const r of items){
    const h = await hashReview(r, place_id);
    // upsert par hash pour éviter les doublons
    await admin.from('reviews_raw').upsert({
      place_id, source:r.source, source_ref:r.source_ref ?? null,
      author:r.author ?? null, rating:r.rating ?? null, text:r.text ?? null,
      url:r.url ?? null, created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      reviewed_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      hash: h,
    }, { onConflict: 'hash' });
  }
}

// --- Analyse très simple (tu peux brancher ton IA existante ici) ---
function quickSummary(all:Review[]){
  const ratings = all.filter(r=>typeof r.rating==='number').map(r=>Number(r.rating));
  const overall = ratings.length ? Number((ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(2)) : null;
  // mini extraction de thèmes par mots clés (placeholder)
  const textBlob = all.map(r=>r.text||'').join('\n').toLowerCase();
  const key = (w:string)=>textBlob.includes(w);
  const top_issues:string[] = [];
  if(key('attente')||key('wait')) top_issues.push('Temps d'attente');
  if(key('prix')||key('cher')) top_issues.push('Prix');
  const top_strengths:string[] = [];
  if(key('qualité')||key('quality')) top_strengths.push('Qualité');
  if(key('service')||key('accueil')) top_strengths.push('Service');
  return { overall_rating: overall, top_issues, top_strengths };
}

serve(async (req)=>{
  if(req.method==='OPTIONS') return new Response('ok',{headers:corsHeaders});
  if(req.method!=='POST') return json({error:'Method not allowed'},405);
  try{
    const body = await req.json().catch(()=>({}));
    const place_id = (body?.place_id??'').trim();
    const name = (body?.name??'').trim();
    const address = (body?.address??'').trim();
    if(!place_id) return json({ok:false,error:'missing_place_id'},400);

    if (body.__ping) {
      return json({
        ok: true,
        env: {
          OPENAI_API_KEY: !!OPENAI_API_KEY,
          GOOGLE_PLACES_API_KEY: !!GOOGLE_PLACES_API_KEY,
          SUPABASE_URL: !!SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: !!SERVICE_ROLE,
          USE_YELP: USE_YELP && !!env('YELP_API_KEY'),
        }
      });
    }

    // Auth utilisateur optionnelle : on essaie de lire le user si le header est présent, sinon on continue
    const authHeader = req.headers.get('Authorization') ?? '';
    let user_id: string | null = null;
    if (authHeader.startsWith('Bearer ')) {
      try {
        const authed = createClient(SUPABASE_URL, SERVICE_ROLE, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await authed.auth.getUser();
        user_id = user?.id ?? null;
      } catch (_e) { /* pas bloquant */ }
    }

    const logs: any[] = [];
    function log(step: string, data?: any) { if (body.__debug) logs.push({ step, data }); }

   // 1) Collecte multi-sources
    log('collect_start', { place_id, name, address });
    const [g,y] = await Promise.all([
      collectGoogle(place_id),
      collectYelp(name, address)
    ]);
    const all = [...g, ...y];
    log('collect_done', { total: all.length, google: g.length, yelp: y.length });

    // 2) Dédupe côté DB (hash) + stockage brut
    if (!body.__dryRun && all.length) {
      await upsertRaw(place_id, all);
      log('upsert_raw_done');
    } else {
      log('upsert_raw_skipped', { dryRun: !!body.__dryRun });
    }

    // 3) Calcul / IA (placeholder simple ici)
    const counts = { collected: all.length, google: g.length, yelp: y.length };
    const meta = { rating: null as number|null, total: null as number|null };
    const summary = quickSummary(all);

    // 4) Upsert insights unifiés
    if (!body.__dryRun) {
      const up = await admin.from('review_insights').upsert({
        place_id,
        user_id,
        last_analyzed_at: new Date().toISOString(),
        summary: { counts, top_issues: summary.top_issues, top_strengths: summary.top_strengths, overall_rating: summary.overall_rating, recommendations: [] },
      }, { onConflict: 'place_id' }).select().single();
      if(up.error) return json({ok:false,error:'upsert_failed:'+up.error.message},500);
      log('upsert_insights_done');
    } else {
      log('upsert_insights_skipped', { dryRun: true });
    }

    return json({ ok:true, counts, g_meta: meta, dryRun: !!body.__dryRun, logs: body.__debug ? logs : undefined });
  }catch(e:any){
    console.error('Error in analyze-reviews:', e);
    return json({ ok:false, error:String(e?.message||e) },500);
  }
});