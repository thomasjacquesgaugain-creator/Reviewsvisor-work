'use client';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function EnvDebug() {
  const [out, setOut] = useState<any>(null);
  return (
    <div className="p-6 space-y-3">
      <button className="btn btn-primary" onClick={async ()=>{
        const { data, error } = await supabase.functions.invoke('analyze-reviews', { body: { __ping: true }});
        setOut(error ? {error} : data);
      }}>Ping analyze_reviews</button>
      <pre className="text-sm">{JSON.stringify(out, null, 2)}</pre>
    </div>
  );
}