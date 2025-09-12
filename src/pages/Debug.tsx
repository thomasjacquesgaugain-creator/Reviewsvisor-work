import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Debug() {
  const [info, setInfo] = useState<any>(null);
  
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setInfo({
        hasSession: Boolean(session),
        user: session?.user?.email || null,
        tokenPreview: session?.access_token ? session.access_token.slice(0, 12) + '…' : null,
      });
    })();
  }, []);
  
  return (
    <div className="min-h-screen bg-background p-6">
      <h1 className="text-2xl font-bold mb-4">Debug Session</h1>
      <pre className="p-6 text-sm bg-muted rounded-lg">{JSON.stringify(info, null, 2)}</pre>
    </div>
  );
}