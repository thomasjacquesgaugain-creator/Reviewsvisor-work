import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type CallbackState = 'loading' | 'success' | 'error';

export default function GoogleCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const stateParam = params.get('state');
      const error = params.get('error');

      // Gestion des erreurs OAuth
      if (error) {
        console.error('❌ OAuth error:', error);
        const errorMessage = error === 'access_denied' 
          ? 'Autorisation refusée. Vous devez accepter les permissions pour continuer.'
          : `Erreur d'authentification: ${error}`;
        
        setMessage(errorMessage);
        setState('error');
        
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: errorMessage
        }, window.location.origin);
        
        setTimeout(() => window.close(), 3000);
        return;
      }

      // Vérification du code
      if (!code) {
        const msg = 'Code d\'autorisation manquant';
        setMessage(msg);
        setState('error');
        
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: msg
        }, window.location.origin);
        
        setTimeout(() => window.close(), 3000);
        return;
      }

      console.log('🔐 Processing OAuth callback...');

      try {
        // Échanger le code contre des tokens via l'edge function
        const { data, error: funcError } = await supabase.functions.invoke('google-oauth-callback', {
          body: { code, state: stateParam }
        });

        if (funcError) {
          throw new Error(funcError.message || 'Erreur lors de l\'échange du code OAuth');
        }

        console.log('✅ OAuth tokens received and stored');
        
        setMessage('Connexion Google réussie ! Vos avis seront importés dans quelques instants.');
        setState('success');

        // Informer la fenêtre parent du succès
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_SUCCESS',
          data
        }, window.location.origin);

        // Fermer automatiquement après 2 secondes
        setTimeout(() => {
          window.close();
        }, 2000);

      } catch (err) {
        console.error('❌ Callback error:', err);
        
        const errorMsg = err instanceof Error 
          ? err.message 
          : 'Échec de l\'authentification Google';
        
        setMessage(errorMsg);
        setState('error');
        
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: errorMsg
        }, window.location.origin);

        setTimeout(() => window.close(), 3000);
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {state === 'loading' && (
              <>
                <div className="flex justify-center">
                  <Loader2 className="h-16 w-16 animate-spin text-primary" />
                </div>
                <h2 className="text-xl font-semibold">Authentification en cours...</h2>
                <p className="text-sm text-muted-foreground">
                  Veuillez patienter pendant que nous finalisons votre connexion Google.
                </p>
              </>
            )}

            {state === 'success' && (
              <>
                <div className="flex justify-center">
                  <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">
                  Connexion réussie !
                </h2>
                <p className="text-sm text-muted-foreground">
                  {message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cette fenêtre va se fermer automatiquement...
                </p>
              </>
            )}

            {state === 'error' && (
              <>
                <div className="flex justify-center">
                  <XCircle className="h-16 w-16 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-destructive">
                  Erreur d'authentification
                </h2>
                <p className="text-sm text-muted-foreground">
                  {message}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cette fenêtre va se fermer dans quelques secondes...
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
