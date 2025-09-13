'use client';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runAnalyze } from '@/lib/runAnalyze';

export default function InsightsDebug() {
  const [pid, setPid] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string>('');
  const [serverOut, setServerOut] = useState<any>(null);

  async function load() {
    if (!pid.trim()) return;
    setBusy(true); setMsg('');
    const { data, error } = await supabase
      .from('review_insights')
      .select('place_id,user_id,last_analyzed_at,summary')
      .eq('place_id', pid.trim())
      .order('last_analyzed_at', { ascending: false });
    if (error) setMsg('SELECT error: ' + error.message);
    setRows(data || []);
    setBusy(false);
  }
  
  async function run() {
    if (!pid.trim()) return;
    setBusy(true); setMsg('');
    try {
      const resp = await runAnalyze({ place_id: pid.trim() });
      setServerOut(resp);
      await load();
      setMsg('Analyse OK (fallback si besoin).');
    } catch (e:any) {
      setServerOut({ error: String(e?.message || e) });
      setMsg('Analyze error.');
    } finally { setBusy(false); }
  }
  
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">Insights Inspector</h1>
      <div className="flex gap-2 items-center">
        <input 
          className="border rounded px-3 py-2 w-96" 
          placeholder="place_id" 
          value={pid} 
          onChange={e => setPid(e.target.value)} 
        />
        <button 
          className="btn btn-secondary" 
          onClick={load} 
          disabled={!pid || busy}
        >
          {busy ? '…' : 'Charger'}
        </button>
        <button 
          className="btn btn-primary" 
          onClick={run} 
          disabled={!pid || busy}
        >
          {busy ? '…' : 'Analyser & enregistrer'}
        </button>
      </div>
      {msg && <div className="text-sm">{msg}</div>}
      <pre className="text-sm whitespace-pre-wrap">
        {JSON.stringify(rows, null, 2)}
      </pre>
      <div className="mt-2 text-sm font-semibold">Retour serveur :</div>
      <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(serverOut, null, 2)}</pre>
      {!rows?.length && (
        <div className="text-sm text-muted-foreground">
          Aucune ligne trouvée (vérifie les politiques RLS et relance une analyse).
        </div>
      )}
    </div>
  );
}