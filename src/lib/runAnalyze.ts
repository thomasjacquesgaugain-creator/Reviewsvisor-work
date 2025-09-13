import { supabase } from '@/lib/supabaseClient';

type Payload = { place_id: string; name?: string; address?: string; __dryRun?: boolean; __debug?: boolean; __ping?: boolean };

// Récupère l'URL et les headers déjà configurés dans supabase.functions
function getFunctionsInfo() {
  const anySb: any = supabase as any;
  const fn = anySb?.functions || {};
  const base =
    fn.url || fn._url || // v2 a une propriété "url"
    (anySb?.rest?.url ? anySb.rest.url.replace('/rest/v1','/functions/v1') : null);
  const headers = fn.headers || {};
  if (!base) throw new Error('Impossible de déterminer l\'URL des Functions depuis supabase.functions');
  return { base: String(base).replace(/\/$/, ''), headers };
}

export async function runAnalyze(body: Payload) {
  // 1) tentative via supabase-js
  try {
    const { data, error } = await supabase.functions.invoke('analyze_reviews', { body });
    if (error) throw error;
    if (!data || (typeof data === 'object' && !('ok' in data))) {
      throw new Error('empty_invoke_response');
    }
    if ((data as any)?.error) throw new Error(String((data as any).error));
    return data;
  } catch {
    // 2) Fallback : fetch brut en réutilisant l'URL + headers internes
    const { base, headers } = getFunctionsInfo();
    const r = await fetch(`${base}/analyze_reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // réutilise apikey/authorization déjà fournis par supabase-js
        ...headers,
      } as Record<string,string>,
      body: JSON.stringify({ __debug: true, ...body }),
    });
    const text = await r.text();
    let json: any = null; try { json = JSON.parse(text); } catch {}
    if (!r.ok) throw new Error((json && (json.error || json.message)) || text || `HTTP ${r.status}`);
    if (json?.error) throw new Error(String(json.error));
    return json;
  }
}