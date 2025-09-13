import { supabase } from '@/lib/supabaseClient';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '@/lib/publicEnv';

type Payload = { place_id: string; name?: string; address?: string; __dryRun?: boolean; __debug?: boolean };

function functionsUrl(path = 'analyze_reviews') {
  if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('ENV manquantes: SUPABASE_URL/ANON_KEY (côté client).');
  }
  return `${PUBLIC_SUPABASE_URL.replace(/\/$/, '')}/functions/v1/${path}`;
}

export async function runAnalyze(body: Payload) {
  // 1) Tentative via supabase-js
  try {
    const { data, error } = await supabase.functions.invoke('analyze_reviews', { body });
    if (error) throw error;
    if (!data || (typeof data === 'object' && !('ok' in data))) {
      throw new Error('empty_invoke_response');
    }
    if ((data as any)?.error) throw new Error(String((data as any).error));
    return data;
  } catch (_err) {
    // 2) Fallback : appel brut vers l'Edge Function
    const url = functionsUrl();
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: PUBLIC_SUPABASE_ANON_KEY,
        authorization: `Bearer ${PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ __debug: true, ...body }),
    });
    const text = await r.text();
    let json: any = null; try { json = JSON.parse(text); } catch {}
    if (!r.ok) throw new Error((json && (json.error || json.message)) || text || `HTTP ${r.status}`);
    if (json?.error) throw new Error(String(json.error));
    return json;
  }
}