import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { pingAnalyzeFunction } from '@/lib/runAnalyze';

export default function DebugEnv() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handlePing = async () => {
    setLoading(true);
    try {
      const response = await pingAnalyzeFunction();
      setResult(response);
    } catch (error) {
      setResult({
        ok: false,
        error: 'ping_failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderEnvStatus = (envVars: Record<string, boolean>) => {
    return Object.entries(envVars).map(([key, value]) => (
      <div key={key} className="flex items-center justify-between p-2 border rounded">
        <span className="font-mono text-sm">{key}</span>
        <div className="flex items-center gap-2">
          {value ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <Badge variant={value ? "default" : "destructive"}>
            {value ? "Configuré" : "Manquant"}
          </Badge>
        </div>
      </div>
    ));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Debug - Variables d'environnement</h1>
        <p className="text-muted-foreground">
          Vérification des variables d'environnement pour l'edge function analyze-reviews
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test de connectivité</CardTitle>
          <CardDescription>
            Ping de l'edge function pour vérifier les variables d'environnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handlePing} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Test en cours...
              </>
            ) : (
              "Ping analyze-reviews"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Résultat du test
              {result.ok ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {result.ok && result.env ? (
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Variables d'environnement</h3>
                {renderEnvStatus(result.env)}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 bg-red-50 border border-red-200 rounded">
                  <h3 className="font-semibold text-red-800">Erreur</h3>
                  <p className="text-red-700">
                    {result.error}: {result.details || 'Impossible de pinguer la fonction'}
                  </p>
                </div>
                
                {result.env && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Variables détectées</h3>
                    {renderEnvStatus(result.env)}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded">
              <h4 className="font-semibold mb-2">Réponse brute</h4>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}