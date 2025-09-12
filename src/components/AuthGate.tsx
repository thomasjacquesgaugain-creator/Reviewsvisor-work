import { ReactNode, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        if (error) console.error(error);
        return; // redirigé vers Google
      }
      setReady(true);
    })();
  }, []);

  if (!ready) return <div className="p-6 text-sm text-muted-foreground">Connexion…</div>;
  return <>{children}</>;
}