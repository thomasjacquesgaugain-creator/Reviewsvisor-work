import { supabase } from '@/lib/supabaseClient';

type Payload = { place_id: string; name?: string; address?: string; __dryRun?: boolean; __debug?: boolean };

export async function runAnalyze(body: Payload) {
  // 1) Tentative via supabase-js
  try {
    const { data, error } = await supabase.functions.invoke('analyze_reviews', { body });
    // Si erreur -> fallback
    if (error) throw error;
    // Si data vide ou pas de drapeau "ok" -> on considère invalide et on fallback
    if (!data || (typeof data === 'object' && !('ok' in data))) {
      throw new Error('empty_invoke_response');
    }
    // Réponse valide
    if ((data as any)?.error) throw new Error(String((data as any).error));
    return data;
  } catch (_err) {
    // 2) Fallback : raw fetch direct vers l'Edge Function
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/analyze_reviews`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
        authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string}`,
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