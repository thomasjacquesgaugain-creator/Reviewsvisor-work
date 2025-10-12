import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = "https://zzjmtipdsccxmmoaetlp.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU";

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
