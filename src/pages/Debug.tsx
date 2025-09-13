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
  return <pre className="p-6 text-sm">{JSON.stringify(info, null, 2)}</pre>;
}