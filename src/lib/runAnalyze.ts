import { supabase } from '@/lib/supabaseClient';
type Payload = { place_id: string; name?: string; address?: string; __dryRun?: boolean; __debug?: boolean; __ping?: boolean };
export async function runAnalyze(body: Payload) {
  const { data, error } = await supabase.functions.invoke('analyze-reviews', {
    body: { __debug: true, ...body },
    headers: { 'x-client': 'web' },
  });
  if (error) throw new Error(error.message || 'invoke_failed');
  if (!data) throw new Error('empty_response');
  if ((data as any).error) throw new Error(String((data as any).error));
  return data;
}