'use client';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runAnalyze } from '@/lib/runAnalyze';

export default function ReviewsDebug() {
  const [placeId, setPlaceId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [out, setOut] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function call(dryRun:boolean) {
    setBusy(true);
    try {
      const resp = await runAnalyze({ place_id: placeId.trim(), name: name.trim() || undefined, address: address.trim() || undefined, __dryRun: dryRun, __debug: true });
      setOut({
        success: { data: resp, picked: resp.__picked, attempts: resp.__attempts },
        error: null
      });
    } catch (e:any) {
      let err: any = null;
      try { err = JSON.parse(String(e?.message || e)); } catch { err = { error: String(e?.message || e) }; }
      setOut({
        success: null,
        error: err
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Debug Reviews (Google Places v1)</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="border rounded px-3 py-2" placeholder="place_id (obligatoire)" value={placeId} onChange={e=>setPlaceId(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="name (optionnel, pour Yelp)" value={name} onChange={e=>setName(e.target.value)} />
        <input className="border rounded px-3 py-2" placeholder="address (optionnel, pour Yelp)" value={address} onChange={e=>setAddress(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <button className="btn btn-secondary" disabled={busy || !placeId} onClick={()=>call(true)}>{busy ? '...' : 'Tester (dry-run)'}</button>
        <button className="btn btn-primary" disabled={busy || !placeId} onClick={()=>call(false)}>{busy ? '...' : 'Analyser & enregistrer'}</button>
      </div>
      <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(out, null, 2)}</pre>
    </div>
  );
}