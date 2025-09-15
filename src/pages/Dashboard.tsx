import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, LogOut, Home, Building2, Star, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { EstablishmentSidebar } from "@/components/EstablishmentSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const Dashboard = () => {
  const { user } = useAuth();
  const { selectedEstablishment } = useEstablishmentStore();
  
  // Review insights data from Supabase
  const [insight, setInsight] = useState<any>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);

  // Fetch review insights data
  useEffect(() => {
    const fetchInsights = async () => {
      if (!user?.id || !selectedEstablishment?.place_id) return;
      
      setIsLoadingInsight(true);
      try {
        const { data: insightData, error } = await supabase
          .from('review_insights')
          .select('counts, overall_rating, top_issues, top_strengths, recommendations, last_analyzed_at')
          .eq('place_id', selectedEstablishment.place_id)
          .eq('user_id', user.id)
          .order('last_analyzed_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[dashboard] review_insights error:', error);
        } else {
          setInsight(insightData);
        }
      } catch (error) {
        console.error('[dashboard] fetch insights error:', error);
      } finally {
        setIsLoadingInsight(false);
      }
    };

    fetchInsights();

    // Écouter les analyses terminées pour rafraîchir automatiquement
    const handleAnalysisCompleted = () => {
      setTimeout(fetchInsights, 1000); // Délai pour laisser le temps à la base de se mettre à jour
    };

    window.addEventListener('analysis-completed', handleAnalysisCompleted);
    return () => window.removeEventListener('analysis-completed', handleAnalysisCompleted);
  }, [user?.id, selectedEstablishment?.place_id]);

  // Map insight data to variables used by UI components
  const totalAnalyzed = insight?.counts?.google ?? 0;
  const avgRating = insight?.overall_rating ?? insight?.g_meta?.rating ?? 4.2;
  const totalReviews = insight?.counts?.google ?? 326;
  const positivePct = insight?.counts?.positive_pct ?? 78;
  const negativePct = insight?.counts?.negative_pct ?? 22;
  const topIssues = insight?.top_issues ?? [];
  const topStrengths = insight?.top_strengths ?? [];
  const recommendations = insight?.recommendations ?? [];

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        {/* Sidebar des établissements */}
        <EstablishmentSidebar />
        
        <div className="flex-1">
          {/* Navigation */}
          <nav className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SidebarTrigger className="mr-2" />
                  <img src="/lovable-uploads/62ee8352-36cc-4657-89b4-5c00321ab74c.png" alt="Analytics Logo" className="w-8 h-8" />
                  <span className="text-xl font-bold text-gray-900">analytique</span>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-6">
                    <Link to="/tableau-de-bord" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Accueil
                    </Link>
                    <Button variant="ghost" className="text-blue-600 font-medium flex items-center gap-2">
                      Dashboard
                    </Button>
                    <Link to="/etablissement" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      Établissement
                    </Link>
                  </div>
                  
                  <div className="flex items-center gap-4 ml-auto">
                    <div className="text-gray-700 font-medium">
                      Bonjour, Yohan Lopes
                    </div>
                    <Button variant="ghost" className="text-gray-600 hover:text-red-600 flex items-center gap-2">
                      <LogOut className="w-4 h-4" />
                      Déconnexion
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Dashboard d'analyse</h1>
              </div>
              {selectedEstablishment ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Analyse de {totalAnalyzed} avis pour {selectedEstablishment.name}</span>
                </div>
              ) : (
                <div className="text-gray-500">
                  Sélectionnez un établissement dans la sidebar pour voir l'analyse
                </div>
              )}
            </div>

            {selectedEstablishment ? (
              <>
                {/* Métriques principales */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
                      </div>
                      <p className="text-sm text-gray-600">Note moyenne</p>
                      <p className="text-xs text-gray-500">Basée sur {totalReviews} avis</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <span className="text-2xl font-bold text-blue-600">{totalReviews}</span>
                        <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
                      </div>
                      <p className="text-sm text-gray-600">Total avis</p>
                      <p className="text-xs text-gray-500">Google Reviews</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6 text-center">
                      <div className="flex items-center justify-center gap-1 mb-2">
                        <span className="text-2xl font-bold text-green-600">{positivePct}%</span>
                      </div>
                      <p className="text-sm text-gray-600">Avis positifs</p>
                      <p className="text-xs text-gray-500">Note ≥ 4 étoiles</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Avis négatifs</div>
                          <div className="text-2xl font-bold">{negativePct}%</div>
                          <div className="text-xs text-gray-400">avis négatifs</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Analyse IA */}
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Points forts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-green-600">Points forts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {topStrengths.length > 0 ? (
                        <div className="space-y-2">
                          {topStrengths.map((strength: string, index: number) => (
                            <div key={index} className="p-3 bg-green-50 rounded-lg">
                              <p className="text-sm text-green-800">{strength}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Aucune analyse disponible</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Problèmes identifiés */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-red-600">Problèmes identifiés</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {topIssues.length > 0 ? (
                        <div className="space-y-2">
                          {topIssues.map((issue: string, index: number) => (
                            <div key={index} className="p-3 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-800">{issue}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Aucune analyse disponible</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Recommandations */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-600">Recommandations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {recommendations.length > 0 ? (
                        <div className="space-y-2">
                          {recommendations.map((recommendation: string, index: number) => (
                            <div key={index} className="p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">{recommendation}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">Aucune analyse disponible</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun établissement sélectionné
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Sélectionnez un établissement dans la sidebar ou ajoutez-en un nouveau
                  </p>
                  <Button asChild>
                    <Link to="/etablissement">
                      Ajouter un établissement
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;