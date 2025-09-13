'use client';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runAnalyze } from '@/lib/runAnalyze';

export default function InsightsDebug() {
  const [pid, setPid] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  
  async function load() {
    setBusy(true);
    const { data } = await supabase
      .from('review_insights')
      .select('place_id,user_id,last_analyzed_at,summary')
      .eq('place_id', pid.trim())
      .order('last_analyzed_at', { ascending: false });
    setRows(data || []);
    setBusy(false);
  }
  
  async function run() {
    setBusy(true);
    await runAnalyze({ place_id: pid.trim() });
    await load();
  }
  
  return (
    <div className="p-6 space-y-3">
      <h1 className="text-xl font-semibold">Insights Inspector</h1>
      <div className="flex gap-2">
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
      <pre className="text-sm whitespace-pre-wrap">
        {JSON.stringify(rows, null, 2)}
      </pre>
    </div>
  );
}