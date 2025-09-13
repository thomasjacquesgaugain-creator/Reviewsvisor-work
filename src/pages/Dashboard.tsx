import { useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentPlace } from '@/lib/currentPlace';
import { runAnalyze } from '@/lib/runAnalyze';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Summary = {
  overall_rating: number | null;
  positive_pct: number | null;
  negative_pct: number | null;
  counts?: { collected?: number; google?: number; yelp?: number; total?: number };
  top_issues?: { label: string; why?: string }[];
  top_strengths?: { label: string; why?: string }[];
  recommendations?: string[];
};

type HistoryItem = {
  last_analyzed_at: string;
  summary: Summary;
  place_id: string;
};

export default function DashboardPage() {
  const location = useLocation();
  const placeId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('place_id') || getCurrentPlace()?.place_id || null;
  }, [location.search]);
  
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lastAt, setLastAt] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Load main data
    if (placeId) {
      const { data, error } = await supabase
        .from('review_insights')
        .select('summary,last_analyzed_at,place_id')
        .eq('place_id', placeId)
        .order('last_analyzed_at', { ascending: false });
        
      if (error) { 
        setErr(error.message); 
        setSummary(null); 
        setLastAt(null); 
        return; 
      }
      
      if (data && data.length > 0) {
        setSummary((data[0].summary as any) ?? null);
        setLastAt(data[0].last_analyzed_at ?? null);
      }
    } else {
      // No place_id, get the most recent analysis
      const { data, error } = await supabase
        .from('review_insights')
        .select('summary,last_analyzed_at,place_id')
        .order('last_analyzed_at', { ascending: false })
        .limit(1);
        
      if (!error && data && data.length > 0) {
        setSummary((data[0].summary as any) ?? null);
        setLastAt(data[0].last_analyzed_at ?? null);
      }
    }
    
    // Load history for all places
    const { data: historyData } = await supabase
      .from('review_insights')
      .select('summary,last_analyzed_at,place_id')
      .order('last_analyzed_at', { ascending: false })
      .limit(10);
      
    if (historyData) {
      setHistory(historyData as HistoryItem[]);
    }
  }

  useEffect(() => {
    (async () => {
      setErr(null); 
      setLoading(true);
      await loadData();
      setLoading(false);
    })();
  }, [placeId]);

  async function rerun() {
    if (!placeId) return;
    const cp = getCurrentPlace() || { place_id: placeId };
    await runAnalyze(cp as any);
    await loadData();
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">Erreur: {err}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard d'analyse</h1>
          <p className="text-slate-600">Aucune analyse disponible pour ce lieu</p>
          <Button onClick={rerun} className="mt-4">
            Lancer une analyse
          </Button>
        </div>
      </div>
    );
  }

  const totalAvis = summary.counts?.collected || summary.counts?.total || 0;
  const positivePercentage = summary.positive_pct != null ? Math.round(summary.positive_pct) : null;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard d'analyse</h1>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-slate-600">
            Analyse de {totalAvis} avis clients
            {lastAt && ` • Dernière analyse : ${new Date(lastAt).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}`}
          </span>
        </div>
      </div>

      {/* Historique des analyses */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">Historique des analyses</CardTitle>
              <p className="text-sm text-slate-500 mt-1">Les analyses précédentes et terminées. Les résultats</p>
            </div>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.slice(0, 5).map((item, idx) => {
                const itemSummary = item.summary as any;
                const count = itemSummary?.counts?.collected || itemSummary?.counts?.total || 0;
                return (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-slate-900 w-8">{count}</span>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {new Date(item.last_analyzed_at).toLocaleDateString('fr-FR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })} à {new Date(item.last_analyzed_at).toLocaleTimeString('fr-FR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        <div className="text-xs text-slate-500">{count}h avis</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-500 text-sm">Aucun historique disponible</p>
          )}
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="space-y-2">
            <div className="text-5xl font-extrabold leading-none">
              ⭐ {summary.overall_rating ? Number(summary.overall_rating).toFixed(1) : '—'}
            </div>
            <div className="text-sm font-medium text-slate-600">Note moyenne</div>
            <div className="text-xs text-slate-500">
              {totalAvis > 0 ? `Basée sur ${totalAvis} avis` : 'Aucun avis disponible'}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="text-5xl font-extrabold leading-none">{totalAvis}</div>
            <div className="text-sm font-medium text-slate-600">Total avis</div>
            <div className="text-xs text-slate-500">Tous plateformes</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-2">
            <div className="text-5xl font-extrabold leading-none">
              {positivePercentage !== null ? `${positivePercentage}%` : '—'}
            </div>
            <div className="text-sm font-medium text-slate-600">Avis positifs</div>
            <div className="text-xs text-slate-500">Note ≥ 4 étoiles</div>
          </div>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={rerun} variant="outline" className="px-6">
          Relancer l'analyse
        </Button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top 3 Problèmes prioritaires */}
        <Card className="p-6">
          <CardTitle className="text-lg font-semibold mb-4">🚨 Top 3 Problèmes prioritaires</CardTitle>
          <div className="space-y-3">
            {summary.top_issues && summary.top_issues.length > 0 ? (
              summary.top_issues.slice(0, 3).map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Badge 
                    variant="destructive" 
                    className={`${idx === 0 || idx === 1 ? 'bg-red-500' : 'bg-yellow-500'} text-white text-xs px-2 py-1`}
                  >
                    {idx === 0 || idx === 1 ? 'Critique' : 'Moyen'}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{issue.label}</p>
                    {issue.why && (
                      <p className="text-xs text-slate-500 mt-1">{issue.why}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">Aucun problème prioritaire identifié</p>
            )}
          </div>
        </Card>

        {/* Top 3 Points forts */}
        <Card className="p-6">
          <CardTitle className="text-lg font-semibold mb-4">✅ Top 3 Points forts</CardTitle>
          <div className="space-y-3">
            {summary.top_strengths && summary.top_strengths.length > 0 ? (
              summary.top_strengths.slice(0, 3).map((strength, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <Badge 
                    variant="secondary" 
                    className="bg-green-500 text-white text-xs px-2 py-1"
                  >
                    Force
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{strength.label}</p>
                    {strength.why && (
                      <p className="text-xs text-slate-500 mt-1">{strength.why}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-sm">Aucun point fort identifié</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recommandations actionnables */}
      <Card className="p-6">
        <CardTitle className="text-lg font-semibold mb-4">💡 Recommandations actionnables</CardTitle>
        {summary.recommendations && summary.recommendations.length > 0 ? (
          <ol className="list-decimal pl-6 space-y-2">
            {summary.recommendations.map((rec, idx) => (
              <li key={idx} className="text-sm leading-relaxed">{rec}</li>
            ))}
          </ol>
        ) : (
          <p className="text-slate-500 text-sm">
            Aucune recommandation spécifique disponible pour le moment.
          </p>
        )}
      </Card>
    </div>
  );
}