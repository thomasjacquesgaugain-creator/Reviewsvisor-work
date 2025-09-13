'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type Summary = {
  overall_rating: number | null;
  positive_pct: number | null;
  negative_pct: number | null;
  counts?: { total?: number };
  recommendations?: string[];
  top_issues?: { label: string; why?: string }[];
  top_strengths?: { label: string; why?: string }[];
};

export default function DiagnosticPanel({
  place_id,
  name,
  address,
}: { place_id: string; name?: string; address?: string }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<{ summary: Summary | null; last: string | null }>({ summary: null, last: null });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('review_insights')
      .select('avg_rating,positive_ratio,total_count,top_issues,top_praises,updated_at')
      .eq('place_id', place_id)
      .maybeSingle();
    if (!error && data) {
      // Map the database columns to our Summary type
      const mappedSummary: Summary = {
        overall_rating: data.avg_rating,
        positive_pct: data.positive_ratio ? Math.round(data.positive_ratio * 100) : null,
        negative_pct: data.positive_ratio ? Math.round((1 - data.positive_ratio) * 100) : null,
        counts: { total: data.total_count || 0 },
        top_issues: (data.top_issues as any[]) || [],
        top_strengths: (data.top_praises as any[]) || [],
        recommendations: []
      };
      setData({
        summary: mappedSummary,
        last: data.updated_at,
      });
    } else {
      setData({ summary: null, last: null });
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [place_id]);

  async function rerun() {
    try {
      setRefreshing(true);
      const { error } = await supabase.functions.invoke('analyze-reviews', {
        body: { place_id, name, address },
      });
      if (error) throw error;
      await load();
      alert('Analyse relancée avec succès.');
    } catch (e) {
      console.error(e);
      alert("Échec du relancement de l'analyse.");
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <div className="mb-4 p-4 rounded-lg border bg-card">Chargement du diagnostic...</div>;

  if (!data.summary) {
    return (
      <div className="mb-4 p-4 rounded-lg border bg-card flex items-center justify-between">
        <div>
          <div className="font-semibold">Diagnostic des avis</div>
          <div className="text-sm text-muted-foreground">Aucune analyse encore disponible pour cet établissement.</div>
        </div>
        <Button onClick={rerun} disabled={refreshing}>
          {refreshing ? 'Analyse en cours...' : 'Lancer une analyse'}
        </Button>
      </div>
    );
  }

  const s = data.summary!;
  return (
    <div className="mb-4 p-4 rounded-lg border bg-card">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Diagnostic des avis</div>
        <div className="text-sm text-muted-foreground">
          Dernière analyse : {data.last ? new Date(data.last).toLocaleString() : '—'}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded border">
          <div className="text-xs text-muted-foreground">Avis collectés (échantillon)</div>
          <div className="text-2xl font-semibold">{s.counts?.total ?? '—'}</div>
        </div>
        <div className="p-3 rounded border">
          <div className="text-xs text-muted-foreground">Note moyenne</div>
          <div className="text-2xl font-semibold">{s.overall_rating ?? '—'}</div>
        </div>
        <div className="p-3 rounded border">
          <div className="text-xs text-muted-foreground">% positifs</div>
          <div className="text-2xl font-semibold">{s.positive_pct != null ? `${s.positive_pct}%` : '—'}</div>
        </div>
        <div className="p-3 rounded border">
          <div className="text-xs text-muted-foreground">% négatifs</div>
          <div className="text-2xl font-semibold">{s.negative_pct != null ? `${s.negative_pct}%` : '—'}</div>
        </div>
      </div>
      <div className="mt-3 flex justify-end">
        <Button onClick={rerun} disabled={refreshing}>
          {refreshing ? 'Analyse en cours...' : 'Relancer l\'analyse'}
        </Button>
      </div>
    </div>
  );
}