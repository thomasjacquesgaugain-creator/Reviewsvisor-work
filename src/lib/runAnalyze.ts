import { supabase } from '@/lib/supabaseClient';

type Payload = { place_id: string; name?: string; address?: string; __dryRun?: boolean; __debug?: boolean; __ping?: boolean };

function getFunctionsBaseFromClient() {
  const sb: any = supabase as any;

  // 1) valeur officielle v2
  if (sb?.supabaseUrl) return `${sb.supabaseUrl.replace(/\/$/, '')}/functions/v1`;

  // 2) à partir de REST
  if (sb?.rest?.url) {
    const origin = new URL(sb.rest.url).origin; // https://xxx.supabase.co
    return `${origin}/functions/v1`;
  }

  // 3) fallback depuis functions.url si présent
  if (sb?.functions?.url) return String(sb.functions.url).replace(/\/$/, '');

  throw new Error('no_functions_base_from_client');
}

function getFunctionsHeadersFromClient() {
  const sb: any = supabase as any;
  // Certaines versions exposent un objet Headers; on le convertit proprement
  const h = sb?.functions?.headers;
  if (h && typeof h.forEach === 'function') {
    const obj: Record<string,string> = {};
    (h as Headers).forEach((v,k)=>{ obj[k] = v; });
    return obj;
  }
  // Sinon, retourne tel quel si c'est déjà un objet simple
  return (h && typeof h === 'object') ? h : {};
}

export async function runAnalyze(body: Payload) {
  // 1) tentative via supabase-js
  try {
    const { data, error } = await supabase.functions.invoke('analyze_reviews', { body });
    if (error) throw error;
    if (!data || (typeof data === 'object' && !('ok' in data))) throw new Error('empty_invoke_response');
    if ((data as any)?.error) throw new Error(String((data as any).error));
    return data;
  } catch (e) {
    // 2) fallback: fetch brut en réutilisant l'URL + headers internes du client
    const base = getFunctionsBaseFromClient();
    const fnHeaders = getFunctionsHeadersFromClient();

    const r = await fetch(`${base}/analyze_reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...fnHeaders, // inclut apikey/authorization si le client les fournit
      } as Record<string,string>,
      body: JSON.stringify({ __debug: true, ...body }),
    });

    const text = await r.text();
    let json: any = null; try { json = JSON.parse(text); } catch {}

    if (!r.ok) {
      const errMsg = (json && (json.error || json.message)) || text || `HTTP ${r.status}`;
      throw new Error(`raw_fetch_failed: ${errMsg} (url=${base}/analyze_reviews)`);
    }
    if (json?.error) throw new Error(`raw_fetch_error: ${json.error} (url=${base}/analyze_reviews)`);
    return json;
  }
}