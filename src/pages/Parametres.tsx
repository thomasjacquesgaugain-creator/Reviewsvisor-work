import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Unplug } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface GoogleConnection {
  id: string;
  created_at: string;
  updated_at: string;
  token_expires_at: string;
}

interface ImportLog {
  id: string;
  place_id: string;
  started_at: string;
  ended_at: string | null;
  inserted_count: number;
  updated_count: number;
  status: string;
}

export default function ParametresPage() {
  const { user } = useAuth();
  const [googleConnection, setGoogleConnection] = useState<GoogleConnection | null>(null);
  const [lastImport, setLastImport] = useState<ImportLog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  useEffect(() => {
    if (user) {
      loadGoogleConnection();
      loadLastImport();
    }
  }, [user]);

  const loadGoogleConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('google_connections')
        .select('*')
        .eq('user_id', user?.id)
        .eq('provider', 'google')
        .single();

      if (!error && data) {
        setGoogleConnection(data);
      }
    } catch (error) {
      console.error('Erreur chargement connexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLastImport = async () => {
    try {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setLastImport(data);
      }
    } catch (error) {
      console.error('Erreur chargement dernière sync:', error);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      // TODO: Implémenter la synchronisation forcée
      toast.info("Fonctionnalité de synchronisation manuelle en cours de développement");
    } catch (error) {
      console.error('Erreur sync:', error);
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Êtes-vous sûr de vouloir déconnecter votre compte Google ? Les avis déjà importés seront conservés.")) {
      return;
    }

    setIsDisconnecting(true);
    try {
      const { error } = await supabase
        .from('google_connections')
        .delete()
        .eq('user_id', user?.id)
        .eq('provider', 'google');

      if (error) throw error;

      setGoogleConnection(null);
      toast.success("Compte Google déconnecté avec succès");
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      toast.error("Erreur lors de la déconnexion");
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
        <p className="text-muted-foreground">
          Gérez vos connexions et la synchronisation de vos avis
        </p>
      </div>

      <div className="space-y-6">
        {/* Connexion Google */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Connexion Google Business Profile</span>
              {googleConnection && (
                <Badge variant="default" className="gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  Connecté
                </Badge>
              )}
              {!googleConnection && (
                <Badge variant="secondary" className="gap-2">
                  <XCircle className="w-3 h-3" />
                  Non connecté
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Connectez votre compte Google pour importer automatiquement vos avis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {googleConnection && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1">Connecté depuis</p>
                    <p className="font-medium">
                      {format(new Date(googleConnection.created_at), "d MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">Dernière mise à jour</p>
                    <p className="font-medium">
                      {format(new Date(googleConnection.updated_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleForceSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Synchronisation...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Forcer une synchronisation
                      </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Déconnexion...
                      </>
                    ) : (
                      <>
                        <Unplug className="w-4 h-4 mr-2" />
                        Déconnecter Google
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}

            {!googleConnection && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Aucune connexion Google active. Rendez-vous sur la page Établissement pour connecter votre compte.
                </p>
                <Button asChild>
                  <a href="/etablissement">
                    Aller à la page Établissement
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dernière synchronisation */}
        {lastImport && (
          <Card>
            <CardHeader>
              <CardTitle>Dernière synchronisation</CardTitle>
              <CardDescription>
                Historique de votre dernière importation d'avis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Date</p>
                  <p className="font-medium">
                    {format(new Date(lastImport.started_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Statut</p>
                  <Badge variant={lastImport.status === 'success' ? 'default' : 'destructive'}>
                    {lastImport.status === 'success' ? 'Réussi' : 'Erreur'}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Nouveaux avis</p>
                  <p className="font-medium text-lg">{lastImport.inserted_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Avis mis à jour</p>
                  <p className="font-medium text-lg">{lastImport.updated_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Synchronisation automatique (Phase 3 - À venir) */}
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Synchronisation automatique</span>
              <Badge variant="outline">À venir</Badge>
            </CardTitle>
            <CardDescription>
              Importation automatique des nouveaux avis toutes les 6 heures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cette fonctionnalité sera disponible prochainement. Elle permettra d'importer automatiquement vos nouveaux avis sans action de votre part.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}