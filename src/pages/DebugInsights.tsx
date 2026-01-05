import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { runAnalyze } from '@/lib/runAnalyze';

export default function DebugInsights() {
  if (import.meta.env.PROD) {
    return <Navigate to="/" replace />;
  }
  const [placeId, setPlaceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzingLoading, setAnalyzingLoading] = useState(false);
  const [insights, setInsights] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleLoad = async () => {
    if (!placeId.trim()) {
      alert('Place ID est requis');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('review_insights')
        .select('*')
        .eq('place_id', placeId.trim())
        .order('last_analyzed_at', { ascending: false });

      if (error) {
        setError(error.message);
        setInsights([]);
      } else {
        setInsights(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeAndRecord = async () => {
    if (!placeId.trim()) {
      alert('Place ID est requis');
      return;
    }

    setAnalyzingLoading(true);
    
    try {
      const result = await runAnalyze({
        place_id: placeId.trim()
      });

      if (result.ok) {
        // Reload insights after successful analysis
        await handleLoad();
      } else {
        setError(`Erreur d'analyse: ${result.error} - ${result.details}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d\'analyse');
    } finally {
      setAnalyzingLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  const renderSummary = (summary: any) => {
    if (!summary || typeof summary !== 'object') {
      return <p className="text-gray-500">Aucune donnée de résumé</p>;
    }

    return (
      <div className="space-y-4">
        {summary.counts && (
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-bold text-blue-600">{summary.counts.collected}</div>
              <div className="text-xs text-blue-800">Collectés</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-bold text-green-600">{summary.counts.google}</div>
              <div className="text-xs text-green-800">Google</div>
            </div>
            <div className="text-center p-2 bg-yellow-50 rounded">
              <div className="font-bold text-yellow-600">{summary.counts.yelp}</div>
              <div className="text-xs text-yellow-800">Yelp</div>
            </div>
          </div>
        )}

        {summary.overall_rating && (
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span>Note globale: {summary.overall_rating}/5</span>
          </div>
        )}

        {summary.top_issues && summary.top_issues.length > 0 && (
          <div>
            <h5 className="font-semibold text-red-700 mb-2">Problèmes principaux</h5>
            <ul className="space-y-1">
              {summary.top_issues.map((issue: any, idx: number) => (
                <li key={idx} className="text-sm flex justify-between">
                  <span>{issue.issue}</span>
                  <span className="text-red-600">
                    {issue.severity} ({issue.percentage}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.top_strengths && summary.top_strengths.length > 0 && (
          <div>
            <h5 className="font-semibold text-green-700 mb-2">Points forts</h5>
            <ul className="space-y-1">
              {summary.top_strengths.map((strength: any, idx: number) => (
                <li key={idx} className="text-sm flex justify-between">
                  <span>{strength.strength}</span>
                  <span className="text-green-600">{strength.percentage}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {summary.recommendations && summary.recommendations.length > 0 && (
          <div>
            <h5 className="font-semibold text-blue-700 mb-2">Recommandations</h5>
            <ul className="space-y-1">
              {summary.recommendations.map((rec: string, idx: number) => (
                <li key={idx} className="text-sm">• {rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Debug - Insights d'avis</h1>
        <p className="text-muted-foreground">
          Consulter et analyser les insights stockés pour un établissement
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recherche d'insights</CardTitle>
          <CardDescription>
            Entrez un Place ID pour charger les analyses existantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="place_id">Place ID</Label>
            <Input
              id="place_id"
              value={placeId}
              onChange={(e) => setPlaceId(e.target.value)}
              placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
            />
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleLoad}
              disabled={loading || !placeId.trim()}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                "Charger"
              )}
            </Button>
            
            <Button
              onClick={handleAnalyzeAndRecord}
              disabled={analyzingLoading || !placeId.trim()}
            >
              {analyzingLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyse...
                </>
              ) : (
                "Analyser & enregistrer"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="mb-6 border-red-200">
          <CardContent className="pt-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h4 className="font-semibold text-red-800">Erreur</h4>
              <p className="text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">
            Insights trouvés ({insights.length})
          </h2>
          
          {insights.map((insight, index) => (
            <Card key={insight.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Analyse #{insight.id}</span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {formatDate(insight.last_analyzed_at)}
                  </div>
                </CardTitle>
                <CardDescription>
                  Place ID: {insight.place_id}
                  {insight.user_id && ` | User ID: ${insight.user_id}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderSummary(insight.summary)}
                
                <details className="mt-4">
                  <summary className="cursor-pointer font-semibold">
                    Données brutes JSON
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                    {JSON.stringify(insight.summary, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {insights.length === 0 && !loading && !error && placeId && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Aucun insight trouvé pour ce Place ID
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}