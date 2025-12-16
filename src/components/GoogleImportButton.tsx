import { useState, useEffect, useRef } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
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
  
  // Ref to track if an operation is in progress (prevents double-clicks)
  const operationInProgress = useRef(false);

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
          .maybeSingle();

        if (connection) {
          setHasExistingConnection(true);

          // If we just came back from OAuth (redirect flow), auto-continue
          const params = new URLSearchParams(window.location.search);
          if (params.get('google') === 'connected') {
            params.delete('google');
            const next = params.toString();
            window.history.replaceState({}, '', `${window.location.pathname}${next ? `?${next}` : ''}`);
            await fetchAccountsAndLocations();
          }
        }
      } catch (err) {
        console.error('Error checking Google connection:', err);
      }
    };

    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get dynamic redirect URI based on current environment
  const getRedirectUri = () => {
    const origin = window.location.origin;
    return `${origin}/api/auth/callback/google/index.html`;
  };

  const handleImportClick = async () => {
    console.log('🔵 SYNC BUTTON CLICKED');
    
    // Guard against double-clicks
    if (loading || operationInProgress.current) {
      console.log('⚠️ Import already in progress, ignoring click');
      return;
    }

    // Show immediate feedback to user
    toast({
      title: "Synchronisation Google démarrée",
      description: "Récupération des avis en cours...",
    });

    if (hasExistingConnection) {
      console.log('🔄 Connection exists, fetching accounts...');
      await fetchAccountsAndLocations();
    } else {
      console.log('🔐 No connection, initiating OAuth...');
      await initiateGoogleOAuth();
    }
  };

  const initiateGoogleOAuth = async () => {
    if (operationInProgress.current) return;
    operationInProgress.current = true;
    setLoading(true);
    
    try {
      console.log('🔐 Initiating Google OAuth...');
      
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

      // Try popup first. If blocked, fallback to full redirect.
      const popup = window.open(
        authUrl.toString(),
        'googleOAuth',
        'width=600,height=700,left=200,top=100'
      );

      if (!popup) {
        console.log('📲 Popup blocked, redirecting...');
        window.location.href = authUrl.toString();
        return;
      }

      // Reset loading since popup opened (user will interact there)
      setLoading(false);
      operationInProgress.current = false;

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

      // Check periodically if popup was closed without completing
      const checkPopupClosed = setInterval(() => {
        if (popup?.closed) {
          clearInterval(checkPopupClosed);
          window.removeEventListener('message', handleMessage);
          // Don't show error - user might have just closed the popup
        }
      }, 1000);

    } catch (error: any) {
      console.error('❌ Error initiating OAuth:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de démarrer l'authentification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      operationInProgress.current = false;
    }
  };

  const fetchAccountsAndLocations = async () => {
    if (operationInProgress.current) {
      console.log('⚠️ Operation already in progress');
      return;
    }
    
    operationInProgress.current = true;
    setLoading(true);
    console.log('🔄 Fetching Google Business accounts and locations...');
    
    try {
      // Get accounts
      console.log('📡 Calling google-business-accounts...');
      const { data: accountsData, error: accountsError } = await supabase.functions.invoke(
        'google-business-accounts'
      );

      console.log('📦 Accounts response:', { accountsData, accountsError });

      // Handle Supabase function errors
      if (accountsError) {
        console.error('❌ Supabase function error:', accountsError);
        throw new Error(accountsError.message || 'Erreur lors de la connexion à Google Business');
      }

      // Handle error in response data (from edge function)
      if (accountsData?.error) {
        const errorMessage = accountsData.error;
        console.error('❌ Error in response:', errorMessage);
        
        // Check for API not enabled error
        if (errorMessage.includes('API_NOT_ENABLED') ||
            errorMessage.includes('API has not been used') || 
            errorMessage.includes('SERVICE_DISABLED') ||
            errorMessage.includes('Enable it by visiting')) {
          console.error('❌ API not enabled:', errorMessage);
          toast({
            title: "API Google Business non activée",
            description: "Veuillez activer l'API 'My Business Account Management' dans votre console Google Cloud, puis réessayer.",
            variant: "destructive",
          });
          return;
        }
        
        // Check if reconnection is needed
        if (errorMessage.includes('connection not found') || 
            errorMessage.includes('RECONNECT') ||
            errorMessage.includes('expired') ||
            errorMessage.includes('revoked') ||
            errorMessage.includes('Access denied')) {
          setHasExistingConnection(false);
          toast({
            title: "Connexion Google requise",
            description: "Veuillez reconnecter votre compte Google Business.",
            variant: "destructive",
          });
          setLoading(false);
          operationInProgress.current = false;
          return;
        }
        
        throw new Error(errorMessage);
      }

      const accounts = accountsData?.accounts || [];
      console.log('✅ Found accounts:', accounts.length);
      
      if (accounts.length === 0) {
        toast({
          title: "Aucun compte trouvé",
          description: "Aucun compte Google Business trouvé. Assurez-vous que votre compte Google est lié à un profil Google Business.",
          variant: "destructive",
        });
        return;
      }

      // Use first account
      const account = accounts[0];
      setAccountId(account.name);
      console.log('📍 Using account:', account.name);

      // Get locations
      console.log('📡 Calling google-business-locations...');
      const { data: locationsData, error: locationsError } = await supabase.functions.invoke(
        'google-business-locations',
        { body: { accountId: account.name } }
      );

      console.log('📦 Locations response:', { locationsData, locationsError });

      if (locationsError) {
        console.error('❌ Locations error:', locationsError);
        throw new Error(locationsError.message || 'Échec de la récupération des emplacements');
      }

      if (locationsData?.error) {
        throw new Error(locationsData.error);
      }

      const locs = locationsData?.locations || [];
      console.log('✅ Found locations:', locs.length);
      
      if (locs.length === 0) {
        toast({
          title: "Aucun emplacement trouvé",
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
      console.error('❌ Error in fetchAccountsAndLocations:', error);
      toast({
        title: "L'import des avis Google a échoué",
        description: error.message || "Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      operationInProgress.current = false;
      console.log('🔓 Loading state reset');
    }
  };

  const importReviews = async (accId: string, locationId: string) => {
    // Don't set operationInProgress here since we're already in an operation
    setLoading(true);
    console.log('🚀 Starting import:', { accountId: accId, locationId, placeId });
    
    try {
      const { data, error } = await supabase.functions.invoke('google-business-reviews', {
        body: {
          accountId: accId,
          locationId,
          placeId,
        },
      });

      console.log('📦 Import response:', { data, error });

      if (error) {
        throw new Error(error.message || "Échec de l'import");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.total === 0) {
        toast({
          title: "Aucun avis trouvé",
          description: "Aucun avis Google n'a été trouvé pour cet établissement.",
          variant: "default",
        });
      } else {
        toast({
          title: "Avis Google importés avec succès",
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
        title: "L'import des avis Google a échoué",
        description: error.message || "Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      operationInProgress.current = false;
      console.log('✅ Import complete, button re-enabled');
    }
  };

  const handleLocationSelect = (locationId: string) => {
    importReviews(accountId, locationId);
  };

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onPointerDown={() => {
          console.log("SYNC POINTERDOWN", new Date().toISOString());
        }}
        onClick={async () => {
          console.log("SYNC CLICK", new Date().toISOString());
          alert("SYNC CLICK OK");

          await handleImportClick();
        }}
        className={cn(
          buttonVariants({ variant: "accent", size: "default" }),
          "w-full pointer-events-auto cursor-pointer relative z-50"
        )}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Importation en cours…
          </>
        ) : hasExistingConnection ? (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Synchroniser mes avis Google
          </>
        ) : (
          "Importer mes avis Google"
        )}
      </button>

      <Dialog open={showLocationSelector} onOpenChange={(open) => {
        setShowLocationSelector(open);
        // If dialog is closed without selecting, reset loading state
        if (!open && loading) {
          setLoading(false);
          operationInProgress.current = false;
        }
      }}>
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
