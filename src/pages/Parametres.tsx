import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Unplug, TrendingUp, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

interface DailyImportStats {
  date: string;
  imported: number;
  updated: number;
  total: number;
}

interface SourceDistribution {
  name: string;
  value: number;
}

interface RatingDistribution {
  rating: string;
  count: number;
}

export default function ParametresPage() {
  const { user } = useAuth();
  const [googleConnection, setGoogleConnection] = useState<GoogleConnection | null>(null);
  const [lastImport, setLastImport] = useState<ImportLog | null>(null);
  const [allImports, setAllImports] = useState<ImportLog[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyImportStats[]>([]);
  const [sourceDistribution, setSourceDistribution] = useState<SourceDistribution[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<RatingDistribution[]>([]);
  const [totalReviews, setTotalReviews] = useState(0);
  const [avgRating, setAvgRating] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    if (user) {
      loadGoogleConnection();
      loadLastImport();
      loadAllImports();
      loadReviewsStats();
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

  const loadAllImports = async () => {
    try {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .eq('user_id', user?.id)
        .order('started_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setAllImports(data);
        calculateDailyStats(data);
      }
    } catch (error) {
      console.error('Erreur chargement imports:', error);
    }
  };

  const calculateDailyStats = (imports: ImportLog[]) => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    const statsMap = new Map<string, { imported: number; updated: number }>();

    imports.forEach(imp => {
      const dateKey = format(startOfDay(new Date(imp.started_at)), 'yyyy-MM-dd');
      const existing = statsMap.get(dateKey) || { imported: 0, updated: 0 };
      statsMap.set(dateKey, {
        imported: existing.imported + (imp.inserted_count || 0),
        updated: existing.updated + (imp.updated_count || 0)
      });
    });

    const stats = last30Days.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const stat = statsMap.get(dateKey) || { imported: 0, updated: 0 };
      return {
        date: format(date, 'd MMM', { locale: fr }),
        imported: stat.imported,
        updated: stat.updated,
        total: stat.imported + stat.updated
      };
    });

    setDailyStats(stats);
  };

  const loadReviewsStats = async () => {
    try {
      // Récupérer tous les avis de l'utilisateur
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('source, rating')
        .eq('user_id', user?.id);

      if (error) throw error;

      setTotalReviews(reviews?.length || 0);

      // Calculer distribution par source
      const sourceMap = new Map<string, number>();
      let totalRating = 0;
      let ratingCount = 0;

      reviews?.forEach(review => {
        const source = review.source || 'unknown';
        sourceMap.set(source, (sourceMap.get(source) || 0) + 1);

        if (review.rating) {
          totalRating += Number(review.rating);
          ratingCount++;
        }
      });

      const sourceDist: SourceDistribution[] = Array.from(sourceMap.entries()).map(([name, value]) => ({
        name: name === 'google' ? 'Google' :
              name === 'pasted' ? 'Collé' :
              name === 'csv' ? 'CSV' :
              name === 'manual' ? 'Manuel' : name,
        value
      }));

      setSourceDistribution(sourceDist);
      setAvgRating(ratingCount > 0 ? totalRating / ratingCount : 0);

      // Calculer distribution des notes
      const ratingMap = new Map<number, number>();
      reviews?.forEach(review => {
        if (review.rating) {
          const rating = Math.round(Number(review.rating));
          ratingMap.set(rating, (ratingMap.get(rating) || 0) + 1);
        }
      });

      const ratingDist: RatingDistribution[] = [1, 2, 3, 4, 5].map(rating => ({
        rating: `${rating}★`,
        count: ratingMap.get(rating) || 0
      }));

      setRatingDistribution(ratingDist);

    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      // Appeler la fonction de synchronisation manuelle
      const { data, error } = await supabase.functions.invoke('google-sync-cron');
      
      if (error) throw error;
      
      toast.success("Synchronisation lancée avec succès");
      
      // Recharger les logs après 2 secondes
      setTimeout(() => {
        loadLastImport();
        loadAllImports();
        loadReviewsStats();
      }, 2000);
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
        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total avis</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReviews}</div>
              <p className="text-xs text-muted-foreground">
                Tous vos avis importés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgRating.toFixed(1)} ★</div>
              <p className="text-xs text-muted-foreground">
                Sur {totalReviews} avis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Imports réussis</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allImports.filter(i => i.status === 'success').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Sur {allImports.length} tentatives
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Évolution temporelle */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Évolution des imports (30 derniers jours)</CardTitle>
              <CardDescription>
                Nombre d'avis importés et mis à jour par jour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="imported" 
                    stroke="#3b82f6" 
                    name="Nouveaux"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="updated" 
                    stroke="#10b981" 
                    name="Mis à jour"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribution par source */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par source</CardTitle>
              <CardDescription>
                D'où proviennent vos avis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sourceDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {sourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribution des notes */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution des notes</CardTitle>
              <CardDescription>
                Répartition par nombre d'étoiles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={ratingDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name="Nombre d'avis" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Historique des imports */}
        {allImports.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Historique des imports</CardTitle>
              <CardDescription>
                Les {Math.min(10, allImports.length)} derniers imports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allImports.slice(0, 10).map((imp) => (
                  <div 
                    key={imp.id} 
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={imp.status === 'success' ? 'default' : 'destructive'}>
                          {imp.status === 'success' ? 'Réussi' : 'Erreur'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(imp.started_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-green-600">{imp.inserted_count} nouveaux</span>
                        {' · '}
                        <span className="font-medium text-blue-600">{imp.updated_count} mis à jour</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {imp.place_id.substring(0, 12)}...
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Separator className="my-8" />

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

        {/* Synchronisation automatique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Synchronisation automatique</span>
              <Badge variant="default">Actif</Badge>
            </CardTitle>
            <CardDescription>
              Importation automatique des nouveaux avis toutes les 6 heures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p className="text-muted-foreground">
                La synchronisation automatique est configurée pour s'exécuter toutes les 6 heures (0:00, 6:00, 12:00, 18:00).
              </p>
              <p className="text-muted-foreground">
                Elle rafraîchit automatiquement vos tokens Google expirés et importe les nouveaux avis sans action de votre part.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">Fonctionnalités :</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Rafraîchissement automatique des tokens expirés</li>
                <li>Import incrémental (uniquement nouveaux avis)</li>
                <li>Traçabilité complète dans l'historique</li>
                <li>Gestion d'erreur avec retry automatique</li>
              </ul>
            </div>

            {googleConnection && (
              <p className="text-xs text-muted-foreground">
                ℹ️ Pour configurer le cron job, consultez le fichier <code className="bg-muted px-1 py-0.5 rounded">CRON_SETUP.md</code>
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}