'use client';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function ReviewsDebug() {
  const [placeId, setPlaceId] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [out, setOut] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  async function call(dryRun:boolean) {
    setBusy(true);
    // 1) via supabase.functions.invoke (pour usage normal)
    const r1 = await supabase.functions.invoke('analyze-reviews', {
      body: { place_id: placeId.trim(), name: name.trim() || undefined, address: address.trim() || undefined, __dryRun: dryRun, __debug: true }
    });
    // 2) via fetch brut pour avoir status et body complets (diagnostic)
    const url = `https://zzjmtipdsccxmmoaetlp.supabase.co/functions/v1/analyze-reviews`;
    const r2 = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ place_id: placeId.trim(), name: name.trim() || undefined, address: address.trim() || undefined, __dryRun: dryRun, __debug: true })
    });
    const text = await r2.text();
    let json:any = null; try { json = JSON.parse(text); } catch {}
    setOut({
      invoke: { data: r1.data ?? null, error: r1.error ?? null },
      raw: { status: r2.status, ok: r2.ok, body: json ?? text }
    });
    setBusy(false);
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