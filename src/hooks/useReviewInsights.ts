import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Summary = {
  overall_rating: number | null;
  positive_pct: number | null;
  negative_pct: number | null;
  counts: { total?: number };
  top_issues: { label: string; why?: string }[];
  top_strengths: { label: string; why?: string }[];
  recommendations: string[];
};

export function useReviewInsights(place_id: string) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    if (!place_id) {
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('review_insights')
          .select('*')
          .eq('place_id', place_id)
          .maybeSingle();
          
        if (!error && data) {
          // Map existing data structure to Summary type
          const mappedSummary: Summary = {
            overall_rating: data.avg_rating || null,
            positive_pct: data.positive_ratio ? Math.round(data.positive_ratio * 100) : null,
            negative_pct: data.positive_ratio ? Math.round((1 - data.positive_ratio) * 100) : null,
            counts: { total: data.total_count || 0 },
            top_issues: (data.top_issues as any[]) || [],
            top_strengths: (data.top_praises as any[]) || [],
            recommendations: []
          };
          setSummary(mappedSummary);
        } else {
          setSummary(null);
        }
      } catch (error) {
        console.error('Error fetching review insights:', error);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [place_id]);

  return { loading, summary };
}