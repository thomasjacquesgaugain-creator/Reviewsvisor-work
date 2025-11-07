import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
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
      const redirectUri = 'https://auth.lovable.so/oauth/callback';
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

      setLoading(false);

      // Open popup
      const popup = window.open(
        authUrl.toString(),
        'googleOAuth',
        'width=600,height=700,left=200,top=100'
      );

      // Listen for OAuth callback
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'oauth-callback' && event.data.code) {
          window.removeEventListener('message', handleMessage);
          popup?.close();
          
          await handleOAuthCallback(event.data.code);
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

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('google-oauth-callback', {
        body: { code },
      });

      if (error) throw error;

      toast({
        title: "Connexion réussie",
        description: "Récupération des emplacements...",
      });

      await fetchAccountsAndLocations();
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de la connexion Google",
        variant: "destructive",
      });
    } finally {
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

      if (accountsError) throw accountsError;

      const accounts = accountsData?.accounts || [];
      
      if (accounts.length === 0) {
        toast({
          title: "Aucun compte",
          description: "Aucun compte Google Business trouvé",
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

      if (locationsError) throw locationsError;

      const locs = locationsData?.locations || [];
      
      if (locs.length === 0) {
        toast({
          title: "Aucun emplacement",
          description: "Aucun emplacement trouvé pour ce compte",
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
      const { data, error } = await supabase.functions.invoke('google-business-reviews', {
        body: {
          accountId: accId,
          locationId,
          placeId,
        },
      });

      if (error) throw error;

      toast({
        title: "Import réussi",
        description: `${data.total} avis importés (${data.inserted} nouveaux, ${data.updated} mis à jour)`,
      });

      setShowLocationSelector(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error importing reviews:', error);
      toast({
        title: "Erreur",
        description: error.message || "Échec de l'import des avis",
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
        onClick={initiateGoogleOAuth}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Importation en cours...
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
