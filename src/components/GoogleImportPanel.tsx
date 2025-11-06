import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GoogleImportPanelProps {
  onImportSuccess?: () => void;
  onClose?: () => void;
}

interface GoogleAccount {
  name: string;
  accountName: string;
  type: string;
}

interface GoogleLocation {
  name: string;
  title: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
  };
  websiteUri?: string;
  categories?: { displayName: string }[];
  profile?: { description: string };
}

export default function GoogleImportPanel({ onImportSuccess, onClose }: GoogleImportPanelProps) {
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const handleGoogleConnect = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour continuer");
      return;
    }

    setIsConnecting(true);

    try {
      const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      
      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        toast.error("Configuration Google OAuth manquante");
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
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(scopes)}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${encodeURIComponent(state)}`;

      console.log('🔐 Opening OAuth popup with redirect:', redirectUri);

      // Ouvrir popup OAuth
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        authUrl,
        'Google OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      if (!popup) {
        toast.error("Veuillez autoriser les popups pour continuer");
        setIsConnecting(false);
        return;
      }

      // Écouter le message de la popup
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'GOOGLE_OAUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          setIsConnected(true);
          toast.success("✅ Connexion Google réussie");
          
          // Charger les comptes
          await loadAccounts();
        } else if (event.data.type === 'GOOGLE_OAUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          toast.error(event.data.error || "Erreur lors de la connexion");
        }
        
        setIsConnecting(false);
      };

      window.addEventListener('message', handleMessage);

    } catch (error) {
      console.error('Erreur OAuth:', error);
      toast.error("Erreur lors de la connexion Google");
      setIsConnecting(false);
    }
  };

  const loadAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-business-accounts');
      
      if (error) throw error;
      
      if (data.accounts && data.accounts.length > 0) {
        setAccounts(data.accounts);
        
        // Si 1 seul compte, le sélectionner automatiquement
        if (data.accounts.length === 1) {
          const accountName = data.accounts[0].name;
          setSelectedAccount(accountName);
          await loadLocations(accountName);
        }
      } else {
        toast.error("Aucun compte Google Business trouvé");
      }
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
      toast.error("Erreur lors du chargement des comptes");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const loadLocations = async (accountName: string) => {
    setIsLoadingLocations(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-business-locations', {
        body: { accountName }
      });
      
      if (error) throw error;
      
      if (data.locations && data.locations.length > 0) {
        setLocations(data.locations);
        
        // Si 1 seul établissement, le sélectionner automatiquement et lancer l'import
        if (data.locations.length === 1) {
          const locationName = data.locations[0].name;
          setSelectedLocation(locationName);
          
          // Auto-lancer l'import
          setTimeout(() => {
            handleImportReviews(accountName, locationName);
          }, 500);
        }
      } else {
        toast.error("Aucun établissement trouvé sur votre compte Google Business");
      }
    } catch (error) {
      console.error('Erreur chargement établissements:', error);
      toast.error("Erreur lors du chargement des établissements");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleImportReviews = async (accountName?: string, locationName?: string) => {
    const account = accountName || selectedAccount;
    const location = locationName || selectedLocation;
    
    if (!account || !location) {
      toast.error("Veuillez sélectionner un établissement");
      return;
    }

    setIsImporting(true);

    try {
      // Récupérer le place_id de l'établissement actuel
      const currentEstablishment = JSON.parse(localStorage.getItem('mon-etablissement') || '{}');
      const placeId = currentEstablishment.place_id;

      if (!placeId) {
        toast.error("Impossible d'identifier l'établissement courant");
        return;
      }

      const { data, error } = await supabase.functions.invoke('google-business-reviews', {
        body: { 
          accountName: account,
          locationName: location,
          placeId 
        }
      });
      
      if (error) throw error;
      
      toast.success(`✅ ${data.inserted} avis importés (${data.updated} mis à jour)`, {
        duration: 5000,
      });

      // Rafraîchir les avis
      window.dispatchEvent(new CustomEvent("reviews:imported", { 
        detail: { establishmentId: placeId } 
      }));

      if (onImportSuccess) {
        onImportSuccess();
      }

      if (onClose) {
        onClose();
      }

    } catch (error) {
      console.error('Erreur import:', error);
      toast.error("Erreur lors de l'import des avis");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div data-testid="google-import-panel" className="space-y-6">
      {/* État initial : pas encore connecté */}
      {!isConnected && (
        <>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Récupération automatique depuis Google</strong>
            </p>
            <p>
              Connectez votre fiche Google pour importer vos avis sans quitter l'application.
            </p>
          </div>

          <Button
            onClick={handleGoogleConnect}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />
                Importer mes avis Google
              </>
            )}
          </Button>
        </>
      )}

      {/* Connecté : sélection compte (si plusieurs) */}
      {isConnected && accounts.length > 1 && !selectedAccount && (
        <div className="space-y-4">
          <h4 className="font-medium">Sélectionnez votre compte Google Business</h4>
          
          {isLoadingAccounts ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <Card 
                  key={account.name}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => {
                    setSelectedAccount(account.name);
                    loadLocations(account.name);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{account.accountName}</div>
                    <div className="text-sm text-muted-foreground">{account.type}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sélection établissement (si plusieurs) */}
      {selectedAccount && locations.length > 1 && !selectedLocation && (
        <div className="space-y-4">
          <h4 className="font-medium">Choisissez votre établissement</h4>
          
          {isLoadingLocations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {locations.map((location) => (
                <Card 
                  key={location.name}
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedLocation(location.name)}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{location.title}</div>
                    {location.storefrontAddress && (
                      <div className="text-sm text-muted-foreground">
                        {location.storefrontAddress.addressLines?.join(', ')}
                        {location.storefrontAddress.locality && `, ${location.storefrontAddress.locality}`}
                      </div>
                    )}
                    {location.categories && location.categories[0] && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {location.categories[0].displayName}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bouton d'import (si établissement sélectionné) */}
      {selectedLocation && !isImporting && (
        <Button
          onClick={() => handleImportReviews()}
          className="w-full"
          size="lg"
        >
          <CheckCircle2 className="w-4 h-4 mr-2" />
          Lancer l'import des avis
        </Button>
      )}

      {/* Import en cours */}
      {isImporting && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
          <p className="text-sm text-muted-foreground">
            Import des avis en cours... Cela peut prendre quelques instants.
          </p>
        </div>
      )}
    </div>
  );
}