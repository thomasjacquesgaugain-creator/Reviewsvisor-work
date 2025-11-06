import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const ConnectGoogleButton = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  const handleConnectGoogle = async () => {
    setIsConnecting(true);

    try {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!clientId || clientId === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        toast({
          title: "Configuration manquante",
          description: "Le Client ID Google n'est pas configuré",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Non authentifié",
          description: "Vous devez être connecté pour lier votre compte Google",
          variant: "destructive",
        });
        setIsConnecting(false);
        return;
      }

      // OAuth scopes for Google Business Profile API
      const scopes = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/business.manage'
      ].join(' ');

      const redirectUri = 'https://auth.lovable.so/oauth/callback';
      const state = btoa(JSON.stringify({ 
        userId: user.id,
        timestamp: Date.now(),
        returnUrl: window.location.href
      }));

      // Build OAuth URL
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      // Open OAuth popup
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl.toString(),
        'Google OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'google-oauth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          
          toast({
            title: "Compte Google connecté",
            description: "Vous pouvez maintenant importer vos avis Google Business Profile",
          });
          
          setIsConnecting(false);
          onSuccess?.();
        } else if (event.data.type === 'google-oauth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          
          toast({
            title: "Erreur de connexion",
            description: event.data.error || "Impossible de connecter votre compte Google",
            variant: "destructive",
          });
          
          setIsConnecting(false);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup was blocked
      if (!popup || popup.closed) {
        window.removeEventListener('message', handleMessage);
        toast({
          title: "Popup bloquée",
          description: "Veuillez autoriser les popups pour ce site",
          variant: "destructive",
        });
        setIsConnecting(false);
      }

    } catch (error) {
      console.error('Error connecting Google:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion à Google",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnectGoogle}
      disabled={isConnecting}
      className="w-full"
    >
      {isConnecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Connexion en cours...
        </>
      ) : (
        <>
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Connecter Google Business Profile
        </>
      )}
    </Button>
  );
};
