'use client';
import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentPlace } from '@/lib/currentPlace';
import { runAnalyze } from '@/lib/runAnalyze';

type Summary = {
  overall_rating: number | null;
  positive_pct: number | null;
  negative_pct: number | null;
  counts?: { total?: number };
  top_issues?: { label: string; why?: string }[];
  top_strengths?: { label: string; why?: string }[];
  recommendations?: string[];
};

export default function DashboardPage() {
  const location = useLocation();
  const placeId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('place_id') || getCurrentPlace()?.place_id || null;
  }, [location.search]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load(pid: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const uid = session?.user?.id ?? null;
    const base = supabase
      .from('review_insights')
      .select('summary,last_analyzed_at')
      .eq('place_id', pid)
      .order('last_analyzed_at', { ascending: false })
      .limit(1);
    
    const { data, error } = uid
      ? await base.eq('user_id', uid).maybeSingle()
      : await base.is('user_id', null).maybeSingle();
      
    if (error) { 
      setErr(error.message); 
      setSummary(null); 
      setLastAt(null); 
      return; 
    }
    setSummary((data?.summary as any) ?? null);
    setLastAt(data?.last_analyzed_at ?? null);
  }

  useEffect(() => {
    (async () => {
      if (!placeId) { setLoading(false); return; }
      setErr(null); 
      setLoading(true);
      await load(placeId);
      setLoading(false);
    })();
  }, [placeId]);

  async function rerun() {
    if (!placeId) return;
    const cp = getCurrentPlace() || { place_id: placeId };
    await runAnalyze(cp as any);
    await load(placeId);
  }

  if (!placeId) return (
    <div className="p-6">
      <div className="mb-2 font-semibold">Aucun établissement sélectionné</div>
      <div className="text-sm text-muted-foreground">Allez sur la page Établissement et lancez une analyse.</div>
    </div>
  );
  
  if (loading) return <div className="p-6">Chargement…</div>;
  if (err) return <div className="p-6 text-red-600">Erreur: {err}</div>;
  if (!summary) return (
    <div className="p-6">
      Aucune analyse disponible pour ce lieu ({placeId}).
      <div className="mt-3"><button className="btn btn-primary" onClick={rerun}>Lancer une analyse</button></div>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          place_id: {placeId}{lastAt ? ` • Dernière analyse: ${new Date(lastAt).toLocaleString()}` : ''}
        </div>
        <button className="btn btn-secondary" onClick={rerun}>Relancer l'analyse</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4"><div className="text-xs text-muted-foreground">Note moyenne</div><div className="text-3xl font-semibold">{summary.overall_rating ?? '—'}</div></div>
        <div className="card p-4"><div className="text-xs text-muted-foreground">Avis positifs</div><div className="text-3xl font-semibold">{summary.positive_pct != null ? `${summary.positive_pct}%` : '—'}</div></div>
        <div className="card p-4"><div className="text-xs text-muted-foreground">Avis négatifs</div><div className="text-3xl font-semibold">{summary.negative_pct != null ? `${summary.negative_pct}%` : '—'}</div></div>
        <div className="card p-4"><div className="text-xs text-muted-foreground">Total avis (échantillon)</div><div className="text-3xl font-semibold">{summary.counts?.total ?? '—'}</div></div>
      </div>

      <section className="card p-4">
        <h3 className="text-lg font-semibold mb-2">Top 3 Problèmes prioritaires</h3>
        <ul className="list-disc pl-6 space-y-1">
          {summary.top_issues?.map((i, idx) => <li key={idx}><span className="font-medium">{i.label}</span>{i.why ? ` — ${i.why}` : ''}</li>)}
        </ul>
      </section>

      <section className="card p-4">
        <h3 className="text-lg font-semibold mb-2">Top 3 Points forts</h3>
        <ul className="list-disc pl-6 space-y-1">
          {summary.top_strengths?.map((i, idx) => <li key={idx}><span className="font-medium">{i.label}</span>{i.why ? ` — ${i.why}` : ''}</li>)}
        </ul>
      </section>

      <section className="card p-4">
        <h3 className="text-lg font-semibold mb-2">Recommandations actionnables</h3>
        <ol className="list-decimal pl-6 space-y-1">
          {summary.recommendations?.map((r, idx) => <li key={idx}>{r}</li>)}
        </ol>
      </section>
    </div>
  );
}