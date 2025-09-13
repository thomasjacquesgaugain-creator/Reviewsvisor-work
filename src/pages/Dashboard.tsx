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
import { CalendarDays, TrendingUp, AlertTriangle, ThumbsUp, Lightbulb } from 'lucide-react';

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
    const uid = session?.user?.id ?? null;
    
    // Load main data
    if (placeId) {
      const { data, error } = await supabase
        .from('review_insights')
        .select('summary,last_analyzed_at,place_id')
        .eq('place_id', placeId)
        .order('last_analyzed_at', { ascending: false })
        .maybeSingle();
        
      if (error) { 
        setErr(error.message); 
        setSummary(null); 
        setLastAt(null); 
        return; 
      }
      
      if (data) {
        setSummary((data.summary as any) ?? null);
        setLastAt(data.last_analyzed_at ?? null);
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
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="p-6">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">Erreur: {err}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Dashboard d'analyse</h1>
          <p className="text-muted-foreground">Aucune analyse disponible pour ce lieu</p>
          <Button onClick={rerun} className="mt-4">
            Lancer une analyse
          </Button>
        </div>
      </div>
    );
  }

  const totalAvis = summary.counts?.collected || summary.counts?.total || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard d'analyse</h1>
            <p className="text-muted-foreground">
              Analyse de {totalAvis} avis clients
              {lastAt && ` • Dernière analyse: ${new Date(lastAt).toLocaleDateString('fr-FR')}`}
            </p>
          </div>
          <Button onClick={rerun} variant="outline">
            Relancer l'analyse
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">⭐ Note moyenne</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.overall_rating ? `${Number(summary.overall_rating).toFixed(1)}/5` : '—'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total avis</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAvis}</div>
            {summary.counts?.google && summary.counts?.yelp && (
              <p className="text-xs text-muted-foreground">
                Google: {summary.counts.google} • Yelp: {summary.counts.yelp}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avis positifs</CardTitle>
            <ThumbsUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.positive_pct != null ? `${Math.round(summary.positive_pct)}%` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Problèmes prioritaires */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Top 3 Problèmes prioritaires
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.top_issues && summary.top_issues.length > 0 ? (
              summary.top_issues.slice(0, 3).map((issue, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-1">
                    {idx + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{issue.label}</p>
                    {issue.why && (
                      <p className="text-sm text-muted-foreground">{issue.why}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Aucun problème prioritaire identifié</p>
            )}
          </CardContent>
        </Card>

        {/* Top 3 Points forts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-green-600" />
              Top 3 Points forts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.top_strengths && summary.top_strengths.length > 0 ? (
              summary.top_strengths.slice(0, 3).map((strength, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                    {idx + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">{strength.label}</p>
                    {strength.why && (
                      <p className="text-sm text-muted-foreground">{strength.why}</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm">Aucun point fort identifié</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommandations actionnables */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-600" />
            Recommandations actionnables
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recommendations && summary.recommendations.length > 0 ? (
            <ol className="list-decimal pl-6 space-y-2">
              {summary.recommendations.map((rec, idx) => (
                <li key={idx} className="text-sm leading-relaxed">{rec}</li>
              ))}
            </ol>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucune recommandation spécifique disponible pour le moment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historique des analyses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Historique des analyses</CardTitle>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
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
              {history.slice(0, 5).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">
                      {new Date(item.last_analyzed_at).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {(item.summary as any)?.counts?.collected || 0} avis analysés
                    </p>
                  </div>
                  <Badge variant="outline">
                    {(item.summary as any)?.overall_rating ? 
                      `${Number((item.summary as any).overall_rating).toFixed(1)}/5` : 
                      'N/A'
                    }
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Aucun historique disponible</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}