// Lecture d'ENV compatible Next, Vite et vanilla
function pickEnv(name: string): string | undefined {
  // Next.js
  try { if (typeof process !== 'undefined' && (process as any)?.env?.[name]) return (process as any).env[name]; } catch {}
  // Vite
  try { const v = (import.meta as any)?.env?.[name]; if (v) return v; } catch {}
  // Global (au cas où)
  try { const g = (globalThis as any)?.[name]; if (g) return g; } catch {}
  try { const w = (window as any)?.__env?.[name]; if (w) return w; } catch {}
  return undefined;
}

export function getPublicEnv(name: string, fallback = ''): string {
  return pickEnv(name) ?? fallback;
}

export const PUBLIC_SUPABASE_URL =
  getPublicEnv('NEXT_PUBLIC_SUPABASE_URL') ||
  getPublicEnv('VITE_SUPABASE_URL') ||
  getPublicEnv('PUBLIC_SUPABASE_URL');

export const PUBLIC_SUPABASE_ANON_KEY =
  getPublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  getPublicEnv('VITE_SUPABASE_ANON_KEY') ||
  getPublicEnv('PUBLIC_SUPABASE_ANON_KEY');