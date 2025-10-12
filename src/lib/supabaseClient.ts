import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://zzjmtipdsccxmmoaetlp.supabase.co";
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU";

// Validation de la configuration
if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Configuration Supabase manquante:', {
    hasUrl: !!SUPABASE_URL,
    hasKey: !!ANON_KEY
  });
}

if (ANON_KEY && (ANON_KEY.length < 30 || ANON_KEY === 'xxxxx' || ANON_KEY.startsWith('your-'))) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY semble invalide (trop courte ou placeholder)');
}

export function checkSupabaseConfig(): { valid: boolean; error?: string } {
  if (!SUPABASE_URL) {
    return { valid: false, error: 'Configuration Supabase manquante (URL)' };
  }
  if (!ANON_KEY) {
    return { valid: false, error: 'Configuration Supabase manquante (Anon key)' };
  }
  if (ANON_KEY.length < 30 || ANON_KEY === 'xxxxx' || ANON_KEY.startsWith('your-')) {
    return { valid: false, error: 'Clé Supabase (anon) invalide. Mettez à jour VITE_SUPABASE_ANON_KEY dans Security.' };
  }
  return { valid: true };
}

export async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? ANON_KEY;
  return {
    'accept': 'application/json',
    'Authorization': `Bearer ${token}`,
    'apikey': ANON_KEY,
  };
}

export { SUPABASE_URL, ANON_KEY };
