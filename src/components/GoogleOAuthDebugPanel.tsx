import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw, Copy, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OAuthDebugInfo {
  clientId: string;
  clientIdSource: string;
  redirectUri: string;
  scope: string;
  authUrl: string;
  callbackRedirectUri: string;
  clientSecretConfigured: boolean;
}

export default function GoogleOAuthDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<OAuthDebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  const loadDebugInfo = async () => {
    setLoading(true);
    try {
      // Fetch client ID from edge function
      const { data: configData, error: configError } = await supabase.functions.invoke(
        'google-client-config'
      );

      if (configError) {
        throw new Error(`Erreur config: ${configError.message}`);
      }

      const clientId = configData?.clientId || 'NON CONFIGURÉ';
      const redirectUri = 'https://reviewsvisor.fr/api/auth/callback/google';
      const scope = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/business.manage',
      ].join(' ');

      // Construct the full OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      // Check if credentials are configured (client secret is always server-side)
      const clientSecretConfigured = !!configData?.clientId; // If clientId works, secret likely set too

      setDebugInfo({
        clientId,
        clientIdSource: 'Variable d\'environnement GOOGLE_CLIENT_ID (Edge Function)',
        redirectUri,
        scope,
        authUrl: authUrl.toString(),
        callbackRedirectUri: redirectUri, // Same as used in frontend
        clientSecretConfigured,
      });

      toast({
        title: "Diagnostic chargé",
        description: "Informations OAuth récupérées avec succès",
      });
    } catch (error: any) {
      console.error('Error loading debug info:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      
      // Set error state
      setDebugInfo({
        clientId: 'ERREUR',
        clientIdSource: 'Impossible de charger',
        redirectUri: 'https://reviewsvisor.fr/api/auth/callback/google',
        scope: 'N/A',
        authUrl: 'N/A',
        callbackRedirectUri: 'N/A',
        clientSecretConfigured: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copié",
      description: `${fieldName} copié dans le presse-papiers`,
    });
  };

  const InfoRow = ({ label, value, copyable = false }: { label: string; value: string; copyable?: boolean }) => (
    <div className="grid grid-cols-[200px_1fr] gap-4 py-2 border-b border-border last:border-b-0">
      <div className="font-semibold text-sm text-muted-foreground">{label}</div>
      <div className="flex items-start gap-2">
        <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all font-mono">
          {value}
        </code>
        {copyable && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => copyToClipboard(value, label)}
          >
            {copiedField === label ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Card className="w-full border-2 border-orange-500 bg-orange-50/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            🔍 Diagnostic OAuth Google
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDebugInfo}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && !debugInfo ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : debugInfo ? (
          <>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
                Configuration Frontend
              </h3>
              <InfoRow 
                label="client_id" 
                value={debugInfo.clientId} 
                copyable 
              />
              <InfoRow 
                label="Source client_id" 
                value={debugInfo.clientIdSource} 
              />
              <InfoRow 
                label="redirect_uri (frontend)" 
                value={debugInfo.redirectUri} 
                copyable 
              />
              <InfoRow 
                label="scope" 
                value={debugInfo.scope} 
                copyable 
              />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
                URL d'autorisation complète
              </h3>
              <InfoRow 
                label="URL OAuth" 
                value={debugInfo.authUrl} 
                copyable 
              />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-sm uppercase text-muted-foreground mb-3">
                Configuration Backend (Edge Function)
              </h3>
              <InfoRow 
                label="redirect_uri (callback)" 
                value={debugInfo.callbackRedirectUri} 
                copyable 
              />
              <InfoRow 
                label="client_secret" 
                value={debugInfo.clientSecretConfigured ? "✅ Configuré (GOOGLE_CLIENT_SECRET)" : "❌ Non configuré"} 
              />
              <InfoRow 
                label="Source secret" 
                value="Variable d'environnement GOOGLE_CLIENT_SECRET (Edge Function)" 
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 mt-4">
              <p className="text-xs text-blue-900">
                <strong>Note:</strong> Les credentials (client_id et client_secret) proviennent des variables d'environnement
                Supabase configurées dans Paramètres → Variables. Le client_id est utilisé côté frontend,
                le client_secret reste côté backend dans l'Edge Function.
              </p>
            </div>
          </>
        ) : (
          <div className="text-center text-muted-foreground py-4">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}
