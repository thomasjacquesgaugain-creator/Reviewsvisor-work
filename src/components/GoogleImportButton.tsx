import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GoogleImportButtonProps {
  onSuccess?: () => void;
  placeId?: string;
}

interface Location {
  name: string;
  locationName: string;
  address?: {
    addressLines?: string[];
  };
}

export default function GoogleImportButton({ onSuccess, placeId }: GoogleImportButtonProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [hasExistingConnection, setHasExistingConnection] = useState(false);

  // Check for existing Google connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: connection } = await supabase
          .from('google_connections')
          .select('id, token_expires_at')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .single();

        if (connection) {
          setHasExistingConnection(true);
        }
      } catch (error) {
        console.log('No existing Google connection');
      }
    };
    checkConnection();
  }, []);

  // Get dynamic redirect URI based on current environment
  const getRedirectUri = () => {
    const origin = window.location.origin;
    return `${origin}/api/auth/callback/google`;
  };

  const handleImportClick = async () => {
    if (hasExistingConnection) {
      // Already connected, try to fetch accounts directly
      await fetchAccountsAndLocations();
    } else {
      // Need to connect first
      await initiateGoogleOAuth();
    }
  };

  const initiateGoogleOAuth = async () => {
    setLoading(true);
    try {
      // Fetch client ID from edge function
      const { data: configData, error: configError } = await supabase.functions.invoke(
        'google-client-config'
      );

      if (configError || !configData?.clientId) {
        toast({
          title: "Configuration OAuth incomplète",
          description: "Ajoutez GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans Paramètres → Variables.",
          variant: "destructive",
        });
        throw new Error('Configuration OAuth incomplète');
      }

      const clientId = configData.clientId;
      const redirectUri = getRedirectUri();
      const scope = [
        'openid',
        'email',
        'profile',
        'https://www.googleapis.com/auth/business.manage',
      ].join(' ');

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', scope);
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');

      console.log('🔗 OAuth redirect URI:', redirectUri);
      setLoading(false);

      // Open popup
      const popup = window.open(
        authUrl.toString(),
        'googleOAuth',
        'width=600,height=700,left=200,top=100'
      );

      // Listen for OAuth callback messages
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'oauth-success') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          setHasExistingConnection(true);
          toast({
            title: "Connexion réussie",
            description: "Récupération des emplacements...",
          });
          await fetchAccountsAndLocations();
        } else if (event.data.type === 'oauth-error') {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          toast({
            title: "Erreur OAuth",
            description: event.data.error || "Échec de la connexion",
            variant: "destructive",
          });
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error: any) {
      console.error('Error initiating OAuth:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer l'authentification",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchAccountsAndLocations = async () => {
    setLoading(true);
    try {
      // Get accounts
      const { data: accountsData, error: accountsError } = await supabase.functions.invoke(
        'google-business-accounts'
      );

      // Check for authentication errors that require reconnection
      if (accountsError || accountsData?.error) {
        const errorMessage = accountsData?.error || accountsError?.message || '';
        
        if (errorMessage.includes('RECONNECT_REQUIRED') || errorMessage.includes('reconnect') || errorMessage.includes('revoked') || errorMessage.includes('expired') || errorMessage.includes('Refresh token')) {
          // Token expired, need to reconnect - trigger OAuth in a separate async context
          setHasExistingConnection(false);
          setLoading(false); // Reset loading before showing toast
          toast({
            title: "Reconnexion nécessaire",
            description: "Votre session Google a expiré. Une nouvelle fenêtre d'autorisation va s'ouvrir...",
          });
          // Use setTimeout to break out of the current try-catch context
          setTimeout(() => initiateGoogleOAuth(), 500);
          return;
        }
        
        throw new Error(errorMessage || 'Failed to fetch accounts');
      }

      const accounts = accountsData?.accounts || [];
      
      if (accounts.length === 0) {
        toast({
          title: "Aucun compte",
          description: "Aucun compte Google Business trouvé. Assurez-vous que votre compte Google est lié à un profil Google Business.",
          variant: "destructive",
        });
        return;
      }

      // Use first account
      const account = accounts[0];
      setAccountId(account.name);

      // Get locations
      const { data: locationsData, error: locationsError } = await supabase.functions.invoke(
        'google-business-locations',
        { body: { accountId: account.name } }
      );

      if (locationsError || locationsData?.error) {
        const errorMessage = locationsData?.error || locationsError?.message || '';
        
        if (errorMessage.includes('RECONNECT_REQUIRED') || errorMessage.includes('reconnect') || errorMessage.includes('revoked') || errorMessage.includes('expired')) {
          setHasExistingConnection(false);
          setLoading(false);
          toast({
            title: "Reconnexion nécessaire",
            description: "Votre session Google a expiré. Une nouvelle fenêtre d'autorisation va s'ouvrir...",
          });
          setTimeout(() => initiateGoogleOAuth(), 500);
          return;
        }
        
        throw new Error(errorMessage || 'Failed to fetch locations');
      }

      const locs = locationsData?.locations || [];
      
      if (locs.length === 0) {
        toast({
          title: "Aucun emplacement",
          description: "Aucun emplacement trouvé pour ce compte Google Business",
          variant: "destructive",
        });
        return;
      }

      if (locs.length === 1) {
        // Only one location, import directly
        await importReviews(account.name, locs[0].name);
      } else {
        // Multiple locations, show selector
        setLocations(locs);
        setShowLocationSelector(true);
      }
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la récupération des emplacements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const importReviews = async (accId: string, locationId: string) => {
    setLoading(true);
    try {
      console.log('🚀 Starting import with:', { accountId: accId, locationId, placeId });
      
      const { data, error } = await supabase.functions.invoke('google-business-reviews', {
        body: {
          accountId: accId,
          locationId,
          placeId,
        },
      });

      console.log('📦 Import response:', data, error);

      if (error) throw error;

      if (data.total === 0) {
        toast({
          title: "Aucun avis trouvé",
          description: "Aucun avis Google n'a été trouvé pour cet établissement.",
          variant: "default",
        });
      } else {
        toast({
          title: "Import réussi",
          description: `${data.total} avis importés (${data.inserted} nouveaux, ${data.updated} mis à jour)`,
        });
      }

      setShowLocationSelector(false);
      
      // Trigger reviews:imported event to refresh the UI
      window.dispatchEvent(new CustomEvent('reviews:imported'));
      
      onSuccess?.();
    } catch (error: any) {
      console.error('❌ Error importing reviews:', error);
      toast({
        title: "Erreur d'import",
        description: error.message || "Échec de l'import des avis. Vérifiez les logs de la console.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (locationId: string) => {
    importReviews(accountId, locationId);
  };

  return (
    <>
      <Button
        onClick={handleImportClick}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Importation en cours...
          </>
        ) : hasExistingConnection ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Synchroniser mes avis Google
          </>
        ) : (
          "Importer mes avis Google"
        )}
      </Button>

      <Dialog open={showLocationSelector} onOpenChange={setShowLocationSelector}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sélectionner un emplacement</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {locations.map((location) => (
              <Button
                key={location.name}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleLocationSelect(location.name)}
                disabled={loading}
              >
                <div>
                  <div className="font-medium">{location.locationName}</div>
                  {location.address?.addressLines && (
                    <div className="text-sm text-muted-foreground">
                      {location.address.addressLines.join(', ')}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
