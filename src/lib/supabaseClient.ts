import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://zzjmtipdsccxmmoaetlp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6am10aXBkc2NjeG1tb2FldGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MjY1NjksImV4cCI6MjA3MzIwMjU2OX0.9y4TO3Hbp2rgD33ygLNRtDZiBbMEJ6Iz2SW6to6wJkU',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

// Expose pour debug (dev uniquement)
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  // @ts-ignore
  window.supabase = supabase;
}