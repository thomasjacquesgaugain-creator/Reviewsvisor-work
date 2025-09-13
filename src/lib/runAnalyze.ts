import { supabase } from '@/lib/supabaseClient';
type Payload = { place_id: string; name?: string; address?: string; __dryRun?: boolean; __debug?: boolean; __ping?: boolean };

function getFunctionsBaseFromClient() {
  const sb: any = supabase as any;
  if (sb?.supabaseUrl) return `${sb.supabaseUrl.replace(/\/$/, '')}/functions/v1`;
  if (sb?.rest?.url)   return `${new URL(sb.rest.url).origin}/functions/v1`;
  if (sb?.functions?.url) return String(sb.functions.url).replace(/\/$/, '');
  throw new Error('no_functions_base_from_client');
}
function getFunctionsHeadersFromClient() {
  const sb: any = supabase as any;
  const h = sb?.functions?.headers;
  if (h && typeof h.forEach === 'function') { const obj: Record<string,string> = {}; (h as Headers).forEach((v,k)=>obj[k]=v); return obj; }
  return (h && typeof h === 'object') ? h : {};
}

export async function runAnalyze(body: Payload) {
  // A) supabase.functions.invoke (méthode officielle)
  try {
    const { data, error } = await supabase.functions.invoke('analyze_reviews', { body });
    if (error) throw error;
    if (!data || (typeof data === 'object' && !('ok' in data))) throw new Error('empty_invoke_response');
    if ((data as any)?.error) throw new Error(String((data as any).error));
    return data;
  } catch {
    // B) Fetch brut via client (fallback robuste)
    const base = getFunctionsBaseFromClient();
    const fnHeaders = getFunctionsHeadersFromClient();
    const r = await fetch(`${base}/analyze_reviews`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', ...fnHeaders } as Record<string,string>,
      body: JSON.stringify({ __debug:true, ...body })
    });
    const text = await r.text();
    let json: any = null; try { json = JSON.parse(text); } catch {}
    if (!r.ok) throw new Error((json && (json.error || json.message)) || text || `HTTP ${r.status} url=${base}/analyze_reviews`);
    if (json?.error) throw new Error(`raw_fetch_error: ${json.error} url=${base}/analyze_reviews`);
    return json;
  }
}