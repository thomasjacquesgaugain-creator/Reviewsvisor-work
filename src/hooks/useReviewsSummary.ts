import useSWR from "swr";
import { supabase } from "@/integrations/supabase/client";

export function useReviewsSummary(estId?: string, bump?: number) {
  const key = estId ? `reviews-summary-${estId}-${bump ?? 0}` : null;
  
  const fetcher = async () => {
    if (!estId) return null;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Non connecté");
    
    const { data, error } = await supabase.functions.invoke('reviews-summary', {
      body: { establishmentId: estId, userId: user.id }
    });
    
    if (error) throw error;
    return data;
  };
  
  const { data, isLoading, mutate } = useSWR(key, fetcher, { revalidateOnFocus: false });
  return { summary: data as { totalAll?: number; avgRating?: number } | undefined, isLoading, refetch: () => mutate() };
}