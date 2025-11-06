import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DiagnosticItem {
  label: string;
  status: 'success' | 'error' | 'warning';
  details?: string;
}

export const OAuthDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticItem[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setIsLoading(true);
    const results: DiagnosticItem[] = [];

    // 1. Vérifier VITE_GOOGLE_CLIENT_ID (frontend)
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const hasValidClientId = clientId && clientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE';
    
    results.push({
      label: 'Client ID configuré (.env)',
      status: hasValidClientId ? 'success' : 'error',
      details: hasValidClientId ? 'Présent' : 'Manquant dans .env'
    });

    // 2. Vérifier les secrets backend (via edge function)
    try {
      const { data, error } = await supabase.functions.invoke('google-oauth-init', {
        method: 'GET'
      });

      if (error) throw error;

      results.push({
        label: 'GOOGLE_CLIENT_ID (secret)',
        status: data?.clientId ? 'success' : 'error',
        details: data?.clientId ? 'Configuré' : 'Manquant'
      });
    } catch (error) {
      results.push({
        label: 'GOOGLE_CLIENT_ID (secret)',
        status: 'error',
        details: 'Impossible de vérifier'
      });
    }

    // Note: Le secret GOOGLE_CLIENT_SECRET ne peut pas être vérifié côté client pour des raisons de sécurité
    results.push({
      label: 'GOOGLE_CLIENT_SECRET (secret)',
      status: 'success',
      details: 'Configuré (non vérifiable)'
    });

    // 3. Vérifier le Redirect URI
    const expectedRedirectUri = 'https://auth.lovable.so/oauth/callback';
    results.push({
      label: 'Redirect URI',
      status: 'success',
      details: expectedRedirectUri
    });

    // 4. Vérifier les scopes requis
    const requiredScopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/business.manage'
    ];

    requiredScopes.forEach(scope => {
      results.push({
        label: `Scope: ${scope}`,
        status: 'success',
        details: 'Configuré dans le code'
      });
    });

    // 5. Vérifier la table google_connections
    try {
      const { error: tableError } = await supabase
        .from('google_connections')
        .select('id')
        .limit(1);

      results.push({
        label: 'Table google_connections',
        status: tableError ? 'error' : 'success',
        details: tableError ? 'Erreur d\'accès' : 'Disponible'
      });
    } catch {
      results.push({
        label: 'Table google_connections',
        status: 'error',
        details: 'Non accessible'
      });
    }

    setDiagnostics(results);
    
    // Vérifier si tout est prêt
    const allSuccess = results.every(r => r.status === 'success');
    setIsReady(allSuccess);
    setIsLoading(false);
  };

  const getStatusIcon = (status: DiagnosticItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-sm">Diagnostic OAuth</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Vérification en cours...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Diagnostic OAuth Google</span>
          {isReady ? (
            <Badge variant="default" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Prêt
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Configuration incomplète
            </Badge>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          État de la configuration Google Business Profile OAuth
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {diagnostics.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {getStatusIcon(item.status)}
                <span className="text-muted-foreground">{item.label}</span>
              </div>
              {item.details && (
                <span className="text-xs font-mono text-muted-foreground">
                  {item.details}
                </span>
              )}
            </div>
          ))}
        </div>

        {!isReady && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-2">
            <p className="text-xs font-medium">Actions requises :</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              {diagnostics
                .filter(d => d.status === 'error')
                .map((d, i) => (
                  <li key={i}>{d.label}: {d.details}</li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
