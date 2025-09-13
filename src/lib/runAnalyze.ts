import { supabase } from '@/lib/supabaseClient';

type Payload = { place_id: string; name?: string; address?: string; __dryRun?: boolean; __debug?: boolean; __ping?: boolean };
type Attempt =
  | { ok: true; via: 'invoke' | 'raw'; name: string; data: any }
  | { ok: false; via: 'invoke' | 'raw'; name: string; error?: string; status?: number; body?: any };

function getFunctionsBaseFromClient() {
  const sb: any = supabase as any;
  if (sb?.supabaseUrl) return `${sb.supabaseUrl.replace(/\/$/, '')}/functions/v1`;
  if (sb?.rest?.url)   return `${new URL(sb.rest.url).origin}/functions/v1`;
  if (sb?.functions?.url) return String(sb.functions.url).replace(/\/$/, '');
  return null;
}
function getFunctionsHeadersFromClient() {
  const sb: any = supabase as any;
  const h = sb?.functions?.headers;
  if (h && typeof h.forEach === 'function') { const obj: Record<string,string> = {}; (h as Headers).forEach((v,k)=>obj[k]=v); return obj; }
  return (h && typeof h === 'object') ? h : {};
}
function getPublicEnv() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return { url, anon };
}

const CANDIDATES = ['analyze-reviews','analyser-avis','analyze_reviews','analyser_avis'];

async function tryInvoke(name: string, body: Payload): Promise<Attempt> {
  try {
    const { data, error } = await supabase.functions.invoke(name, {
      body: { __debug: true, ...body },
      headers: { 'x-client': 'web' },
    });
    if (error) return { ok: false, via: 'invoke', name, error: error.message || String(error) };
    if (!data)  return { ok: false, via: 'invoke', name, error: 'empty_response' };
    if ((data as any)?.error) return { ok: false, via: 'invoke', name, error: String((data as any).error) };
    return { ok: true, via: 'invoke', name, data };
  } catch (e:any) { return { ok: false, via: 'invoke', name, error: String(e?.message||e) }; }
}

async function tryRaw(name: string, body: Payload): Promise<Attempt> {
  try {
    // Base URL: client → env publics
    let base = getFunctionsBaseFromClient();
    const fnHeaders = getFunctionsHeadersFromClient();
    const { url: envUrl, anon } = getPublicEnv();
    if (!base && envUrl) base = `${envUrl}/functions/v1`;
    if (!base) return { ok: false, via: 'raw', name, error: 'no_functions_base_url' };

    // Toujours forcer les en-têtes d'auth Supabase pour éviter 401
    const headers: Record<string,string> = {
      'Content-Type': 'application/json',
      ...fnHeaders,
    };
    if (anon) {
      headers.apikey = anon;
      headers.authorization = `Bearer ${anon}`;
    }

    const r = await fetch(`${base}/${name}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ __debug: true, ...body }),
    });

    const text = await r.text();
    let json: any = null; try { json = JSON.parse(text); } catch {}

    if (!r.ok) return { ok: false, via: 'raw', name, status: r.status, body: json ?? text };
    if (json?.error) return { ok: false, via: 'raw', name, status: r.status, body: json };
    return { ok: true, via: 'raw', name, data: json };
  } catch (e:any) {
    return { ok: false, via: 'raw', name, error: String(e?.message || e) };
  }
}

export async function runAnalyze(body: Payload) {
  const attempts: Attempt[] = [];
  for (const name of CANDIDATES) {
    const a1 = await tryInvoke(name, body); attempts.push(a1);
    if (a1.ok) return { ...a1.data, __picked: { name, via: 'invoke' }, __attempts: attempts };

    const a2 = await tryRaw(name, body); attempts.push(a2);
    if (a2.ok) return { ...a2.data, __picked: { name, via: 'raw' }, __attempts: attempts };
  }
  throw new Error(JSON.stringify({ message: 'all_candidates_failed', attempts }));
}