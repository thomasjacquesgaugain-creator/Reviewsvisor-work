import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { runAnalyze } from '@/lib/runAnalyze';

export default function DebugReviews() {
  if (import.meta.env.PROD) {
    return <Navigate to="/" replace />;
  }
  const [formData, setFormData] = useState({
    place_id: '',
    name: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnalyze = async (dryRun: boolean) => {
    if (!formData.place_id.trim()) {
      alert('Place ID est requis');
      return;
    }

    setLoading(true);
    try {
      const response = await runAnalyze({
        place_id: formData.place_id.trim(),
        name: formData.name.trim() || undefined,
        address: formData.address.trim() || undefined,
        dryRun
      });
      setResult(response);
    } catch (error) {
      setResult({
        ok: false,
        error: 'invoke_failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Debug - Analyses d'avis</h1>
        <p className="text-muted-foreground">
          Tester l'analyse d'avis avec l'edge function analyze-reviews
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Paramètres d'analyse</CardTitle>
          <CardDescription>
            Entrez les détails de l'établissement à analyser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="place_id">Place ID (requis)</Label>
            <Input
              id="place_id"
              value={formData.place_id}
              onChange={(e) => handleInputChange('place_id', e.target.value)}
              placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
            />
          </div>
          
          <div>
            <Label htmlFor="name">Nom (optionnel)</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ex: Restaurant Le Bistrot"
            />
          </div>
          
          <div>
            <Label htmlFor="address">Adresse (optionnel)</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Ex: 123 rue de la République, Paris"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => handleAnalyze(true)}
              disabled={loading || !formData.place_id.trim()}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Test...
                </>
              ) : (
                "Dry-run"
              )}
            </Button>
            
            <Button
              onClick={() => handleAnalyze(false)}
              disabled={loading || !formData.place_id.trim()}
            >
              {loading ? (
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

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Résultat de l'analyse
              <span className={`px-2 py-1 rounded text-xs ${
                result.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {result.ok ? 'Succès' : 'Erreur'}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.ok ? (
              <div className="space-y-4">
                {result.counts && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 rounded">
                      <div className="text-2xl font-bold text-blue-600">
                        {result.counts.collected}
                      </div>
                      <div className="text-sm text-blue-800">Avis collectés</div>
                    </div>
                    <div className="p-3 bg-green-50 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {result.counts.google}
                      </div>
                      <div className="text-sm text-green-800">Google</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {result.counts.yelp}
                      </div>
                      <div className="text-sm text-yellow-800">Yelp</div>
                    </div>
                  </div>
                )}

                {result.g_meta && (
                  <div className="p-3 bg-gray-50 rounded">
                    <h4 className="font-semibold mb-2">Métadonnées Google</h4>
                    <p>Note: {result.g_meta.rating}/5</p>
                    <p>Nombre total d'avis: {result.g_meta.user_ratings_total}</p>
                  </div>
                )}

                {result.dryRun && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 font-semibold">
                      Mode dry-run - Aucune donnée n'a été enregistrée
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h4 className="font-semibold text-red-800">Erreur</h4>
                <p className="text-red-700">
                  {result.error}: {result.details || 'Erreur inconnue'}
                </p>
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">Réponse complète</h4>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}