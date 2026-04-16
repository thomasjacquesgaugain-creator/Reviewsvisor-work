import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const ANON_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  '';

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('[Supabase] Missing configuration:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!ANON_KEY,
  });
}

if (
  ANON_KEY &&
  (ANON_KEY.length < 30 ||
    ANON_KEY === 'xxxxx' ||
    ANON_KEY.startsWith('your-'))
) {
  console.warn(
    '[Supabase] VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY looks invalid.',
  );
}

export function checkSupabaseConfig(): { valid: boolean; error?: string } {
  if (!SUPABASE_URL) {
    return { valid: false, error: 'Missing Supabase URL configuration.' };
  }
  if (!ANON_KEY) {
    return { valid: false, error: 'Missing Supabase publishable key.' };
  }
  if (
    ANON_KEY.length < 30 ||
    ANON_KEY === 'xxxxx' ||
    ANON_KEY.startsWith('your-')
  ) {
    return {
      valid: false,
      error:
        'Invalid Supabase publishable key. Update VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY.',
    };
  }
  return { valid: true };
}

export async function authHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token ?? ANON_KEY;
  return {
    accept: 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: ANON_KEY,
  };
}

export { SUPABASE_URL, ANON_KEY };
