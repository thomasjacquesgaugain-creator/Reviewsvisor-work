import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function GoogleCallbackPage() {
  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const error = params.get('error');

      if (error) {
        console.error('Erreur OAuth:', error);
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: 'Autorisation refusée. Réessayez en acceptant l\'accès aux avis.'
        }, window.location.origin);
        window.close();
        return;
      }

      if (!code) {
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: 'Code OAuth manquant'
        }, window.location.origin);
        window.close();
        return;
      }

      try {
        // Appeler la fonction edge pour échanger le code contre des tokens
        const { data, error: funcError } = await supabase.functions.invoke('google-oauth-callback', {
          body: { code, state }
        });

        if (funcError) {
          throw funcError;
        }

        // Informer la fenêtre parent du succès
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_SUCCESS',
          data
        }, window.location.origin);

        // Fermer la popup après un court délai
        setTimeout(() => {
          window.close();
        }, 500);

      } catch (err) {
        console.error('Erreur callback:', err);
        window.opener?.postMessage({
          type: 'GOOGLE_OAUTH_ERROR',
          error: 'Échec de l\'authentification Google'
        }, window.location.origin);
        window.close();
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Authentification en cours...</p>
      </div>
    </div>
  );
}