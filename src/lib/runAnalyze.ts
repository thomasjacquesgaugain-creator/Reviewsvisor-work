import { supabase } from '@/integrations/supabase/client';

type Payload = { place_id: string; name?: string; address?: string; __dryRun?: boolean; __debug?: boolean };

export async function runAnalyze(body: Payload) {
  // 1) tentative via supabase-js
  try {
    const { data, error } = await supabase.functions.invoke('analyze_reviews', { body });
    if (error) throw error;
    if (data?.error) throw new Error(String(data.error));
    return data;
  } catch (err) {
    // 2) Fallback : raw fetch direct vers Functions
    const url = `https://zzjmtipdsccxmmoaetlp.supabase.co/functions/v1/analyze_reviews`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Edge function publique, mais on envoie quand même les clés pour compat
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU',
        authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU`,
      },
      body: JSON.stringify(body),
    });
    const text = await r.text();
    let json: any = null; try { json = JSON.parse(text); } catch {}
    if (!r.ok) throw new Error((json && (json.error || json.message)) || text || `HTTP ${r.status}`);
    if (json?.error) throw new Error(String(json.error));
    return json;
  }
}