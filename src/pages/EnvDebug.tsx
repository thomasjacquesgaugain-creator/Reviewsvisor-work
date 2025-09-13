'use client';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { runAnalyze } from '@/lib/runAnalyze';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EnvDebug() {
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePing = async () => {
    setLoading(true);
    try {
      const data = await runAnalyze({ place_id: 'test', __ping: true });
      setOut(data);
    } catch (e) {
      setOut({ error: String((e as Error)?.message || e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Environment Debug</CardTitle>
            <p className="text-sm text-muted-foreground">
              Test la disponibilité des variables d'environnement de l'edge function analyze-reviews
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={handlePing}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Test en cours...' : 'Ping analyze_reviews'}
            </Button>
            
            {out && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2">Résultat :</h3>
                <pre className="text-sm bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 border">
                  {JSON.stringify(out, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}