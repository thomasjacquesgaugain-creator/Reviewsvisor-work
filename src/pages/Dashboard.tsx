import { AnalyseDashboard } from "@/components/AnalyseDashboard";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, User, LogOut, Home, Eye, Trash2, AlertTriangle, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, ChevronRight, Building2, Star, UtensilsCrossed, Wine, Users, MapPin, Clock, MessageSquare, Info, Loader2, Copy, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { Etab, STORAGE_KEY, EVT_SAVED, STORAGE_KEY_LIST } from "@/types/etablissement";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area } from 'recharts';
import { getRatingEvolution, formatRegistrationDate, Granularity } from "@/utils/ratingEvolution";
import { validateReponse } from "@/lib/reponses";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const etablissementId = searchParams.get('etablissementId');
  const {
    user,
    displayName,
    loading,
    signOut
  } = useAuth();
  const {
    selectedEstablishment
  } = useEstablishmentStore();
  const [showAvis, setShowAvis] = useState(false);
  const [showPlateformes, setShowPlateformes] = useState(false);
  const [showCourbeNote, setShowCourbeNote] = useState(false);
  const [showAvisPositifs, setShowAvisPositifs] = useState(false);
  const [showAvisNegatifs, setShowAvisNegatifs] = useState(false);
  const [showThematiques, setShowThematiques] = useState(false);
  const [showReponseAuto, setShowReponseAuto] = useState(false);
  const [showParetoChart, setShowParetoChart] = useState(false);
  const [showParetoPoints, setShowParetoPoints] = useState(false);
  const [granularityEvolution, setGranularityEvolution] = useState<Granularity>("mois");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Établissement sélectionné (depuis localStorage ou store)
  const [selectedEtab, setSelectedEtab] = useState<Etab | null>(null);

  // Liste des établissements enregistrés
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [showEstablishmentsDropdown, setShowEstablishmentsDropdown] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSelectedEtab(JSON.parse(raw));

      // Charger la liste des établissements
      const rawList = localStorage.getItem(STORAGE_KEY_LIST);
      if (rawList) setEstablishments(JSON.parse(rawList));
    } catch {}
    const onSaved = (e: any) => setSelectedEtab(e.detail as Etab);
    window.addEventListener(EVT_SAVED, onSaved);
    return () => window.removeEventListener(EVT_SAVED, onSaved);
  }, []);
  useEffect(() => {
    if (selectedEstablishment) {
      setSelectedEtab({
        place_id: selectedEstablishment.place_id,
        name: selectedEstablishment.name,
        address: selectedEstablishment.formatted_address || "",
        lat: selectedEstablishment.lat ?? null,
        lng: selectedEstablishment.lng ?? null,
        website: selectedEstablishment.website,
        phone: selectedEstablishment.phone,
        rating: selectedEstablishment.rating ?? null
      });
    }
  }, [selectedEstablishment]);

  // Review insights data from Supabase
  const [insight, setInsight] = useState<any>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  
  // Vrais avis récents depuis la base de données
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [topReviews, setTopReviews] = useState<any[]>([]);
  const [worstReviews, setWorstReviews] = useState<any[]>([]);
  const [allReviewsForChart, setAllReviewsForChart] = useState<any[]>([]);
  const [establishmentCreatedAt, setEstablishmentCreatedAt] = useState<string | null>(null);
  
  // Stats par plateforme
  const [platformStats, setPlatformStats] = useState<Record<string, { count: number; avgRating: number }>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // États pour l'édition des réponses automatiques
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editedResponses, setEditedResponses] = useState<Record<string, string>>({});
  const [validatedReviews, setValidatedReviews] = useState<Set<number>>(new Set());
  const [isValidatingReview, setIsValidatingReview] = useState<Record<number, boolean>>({});
  
  // Liste des avis à valider (filtrés pour exclure les validés)
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  // Mocked data for Pareto charts (will be updated below after variables are declared)
  const defaultParetoData = [{
    name: "Service lent",
    count: 45,
    percentage: 32.1,
    cumulative: 32.1
  }, {
    name: "Nourriture froide",
    count: 38,
    percentage: 27.1,
    cumulative: 59.2
  }, {
    name: "Attente longue",
    count: 25,
    percentage: 17.9,
    cumulative: 77.1
  }];
  const defaultParetoPointsData = [{
    name: "Qualité nourriture",
    count: 52,
    percentage: 35.4,
    cumulative: 35.4
  }, {
    name: "Service rapide",
    count: 41,
    percentage: 27.9,
    cumulative: 63.3
  }, {
    name: "Ambiance agréable",
    count: 28,
    percentage: 19.0,
    cumulative: 82.3
  }];

  // Fetch review insights data
  useEffect(() => {
    const fetchInsights = async () => {
      // Utiliser selectedEtab (localStorage) ou selectedEstablishment (store)
      const currentEstab = selectedEtab || selectedEstablishment;
      if (!user?.id || !currentEstab?.place_id) return;
      
      setIsLoadingInsight(true);
      try {
        const {
          data: insightData,
          error
        } = await supabase.from('review_insights').select('total_count, avg_rating, top_issues, top_praises, positive_ratio, last_analyzed_at, summary, themes').eq('place_id', currentEstab.place_id).eq('user_id', user.id).order('last_analyzed_at', {
          ascending: false
        }).limit(1).maybeSingle();
        if (error) {
          console.error('[dashboard] review_insights error:', error);
        } else {
          console.log('[dashboard] Insights loaded:', insightData);
          setInsight(insightData);
        }
        
        // Charger les vrais avis récents
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .eq('place_id', currentEstab.place_id)
          .eq('user_id', user.id)
          .order('published_at', { ascending: false });
          
        if (reviewsError) {
          console.error('[dashboard] reviews error:', reviewsError);
        } else if (reviewsData) {
          setRecentReviews(reviewsData.slice(0, 3));
          setAllReviewsForChart(reviewsData);
          
          // Top 5 meilleurs avis (note >= 4)
          const bestReviews = reviewsData
            .filter(r => r.rating && r.rating >= 4)
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5);
          setTopReviews(bestReviews);
          
          // Top 5 pires avis (note <= 2)
          const badReviews = reviewsData
            .filter(r => r.rating && r.rating <= 2)
            .sort((a, b) => (a.rating || 0) - (b.rating || 0))
            .slice(0, 5);
          setWorstReviews(badReviews);
          
          // Calculer les stats par plateforme
          const statsByPlatform: Record<string, { count: number; totalRating: number; avgRating: number }> = {};
          reviewsData.forEach(review => {
            const source = review.source || 'unknown';
            if (!statsByPlatform[source]) {
              statsByPlatform[source] = { count: 0, totalRating: 0, avgRating: 0 };
            }
            statsByPlatform[source].count++;
            if (review.rating) {
              statsByPlatform[source].totalRating += review.rating;
            }
          });
          
          // Calculer les moyennes
          Object.keys(statsByPlatform).forEach(source => {
            const stat = statsByPlatform[source];
            stat.avgRating = stat.count > 0 ? stat.totalRating / stat.count : 0;
          });
          
          setPlatformStats(statsByPlatform);
        }

        // Récupérer la date de création de l'établissement
        const { data: establishmentData, error: estError } = await supabase
          .from('establishments')
          .select('created_at')
          .eq('place_id', currentEstab.place_id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!estError && establishmentData) {
          setEstablishmentCreatedAt(establishmentData.created_at);
        } else {
          // Fallback: utiliser la date du plus ancien avis ou aujourd'hui
          if (reviewsData && reviewsData.length > 0) {
            const oldestReview = reviewsData
              .filter(r => r.published_at || r.inserted_at)
              .sort((a, b) => {
                const dateA = new Date(a.published_at || a.inserted_at || '');
                const dateB = new Date(b.published_at || b.inserted_at || '');
                return dateA.getTime() - dateB.getTime();
              })[0];
            
            if (oldestReview) {
              setEstablishmentCreatedAt(oldestReview.published_at || oldestReview.inserted_at);
            }
          }
        }

        // Charger les réponses validées et construire la liste des avis à valider
        if (currentEstab?.place_id && user?.id) {
          const { data: responsesData } = await supabase
            .from('reponses')
            .select('avis_id')
            .eq('etablissement_id', currentEstab.place_id)
            .eq('user_id', user.id)
            .eq('statut', 'valide');
          
          if (responsesData) {
            const validatedSet = new Set(responsesData.map(r => parseInt(r.avis_id)));
            setValidatedReviews(validatedSet);
            
            // Filtrer les avis pour exclure ceux déjà validés
            if (reviewsData) {
              const pending = reviewsData.filter(review => !validatedSet.has(review.id));
              setPendingReviews(pending);
            }
          }
        }
      } catch (error) {
        console.error('[dashboard] fetch insights error:', error);
      } finally {
        setIsLoadingInsight(false);
      }
    };
    fetchInsights();
  }, [user?.id, selectedEstablishment?.place_id, selectedEtab?.place_id]);

  // Mise à jour de l'heure en temps réel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Formatage de la date et de l'heure
  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }),
      time: date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit"
      })
    };
  };
  const {
    date,
    time
  } = formatDateTime(currentDateTime);

  // Map insight data to variables used by UI components
  const totalAnalyzed = insight?.total_count ?? 0;
  const avgRating = insight?.avg_rating ?? 4.2;
  const totalReviews = insight?.total_count ?? 0;
  const positivePct = insight?.positive_ratio != null ? Math.round(insight.positive_ratio * 100) : 78;
  const negativePct = 100 - positivePct;
  const topIssues = insight?.top_issues ?? [];
  const topStrengths = insight?.top_praises ?? [];

  // Map top issues to Pareto data format
  const paretoData = topIssues.length > 0 ? topIssues.slice(0, 3).map((issue: any, index: number) => {
    const count = issue.count || issue.mentions || 0;
    const percentage = totalAnalyzed > 0 ? count / totalAnalyzed * 100 : 0;
    return {
      name: issue.theme || issue.issue || `Problème ${index + 1}`,
      count,
      percentage,
      cumulative: 0 // Will be calculated below
    };
  }) : defaultParetoData;

  // Calculate cumulative percentages for issues
  let cumulativeIssues = 0;
  paretoData.forEach((item: any) => {
    cumulativeIssues += item.percentage;
    item.cumulative = cumulativeIssues;
  });

  // Map top strengths to Pareto data format
  const paretoPointsData = topStrengths.length > 0 ? topStrengths.slice(0, 3).map((strength: any, index: number) => {
    const count = strength.count || strength.mentions || 0;
    const percentage = totalAnalyzed > 0 ? count / totalAnalyzed * 100 : 0;
    return {
      name: strength.theme || strength.strength || `Point fort ${index + 1}`,
      count,
      percentage,
      cumulative: 0 // Will be calculated below
    };
  }) : defaultParetoPointsData;

  // Calculate cumulative percentages for strengths
  let cumulativeStrengths = 0;
  paretoPointsData.forEach((item: any) => {
    cumulativeStrengths += item.percentage;
    item.cumulative = cumulativeStrengths;
  });
  // Formatter une date pour l'affichage
  const formatReviewDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date inconnue';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Calculer l'évolution de la note depuis l'enregistrement
  const courbeNoteData = useMemo(() => {
    if (!establishmentCreatedAt || allReviewsForChart.length === 0) {
      // Pas de données : retourner une courbe vide ou par défaut
      return [];
    }
    
    return getRatingEvolution(allReviewsForChart, establishmentCreatedAt, granularityEvolution);
  }, [allReviewsForChart, establishmentCreatedAt, granularityEvolution]);

  // If we have an etablissementId in URL, show analysis dashboard
  if (etablissementId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <AnalyseDashboard />
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/lovable-uploads/62ee8352-36cc-4657-89b4-5c00321ab74c.png" alt="Logo Reviewsvisor" className="w-8 h-8" />
              <span className="text-xl font-bold text-gray-900">Reviewsvisor</span>
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
                  {loading ? "Bonjour..." : displayName ? `Bonjour, ${displayName}` : <Link to="/login">Se connecter</Link>}
                </div>
                <Button variant="ghost" className="text-gray-600 hover:text-red-600 flex items-center gap-2" onClick={signOut}>
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
          <div className="flex items-center gap-2 text-gray-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>Analyse de {totalAnalyzed} avis clients</span>
          </div>
        </div>

        {/* Établissement sélectionné */}
        {selectedEstablishment && <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{selectedEstablishment.name}</div>
                  <div className="text-sm text-gray-500">{selectedEstablishment.formatted_address}</div>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Établissement sélectionné */}
        {selectedEtab && <Card className="mb-4">
            <CardContent className="p-4">
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-600" />
                    </div>
                    {/* Flèche vers le bas en haut à droite de l'icône */}
                    <Popover open={showEstablishmentsDropdown} onOpenChange={setShowEstablishmentsDropdown}>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 p-0.5 h-auto w-auto bg-white border border-gray-200 rounded-full shadow-sm" title="Choisir un autre établissement">
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2 bg-white" align="start">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-700 px-3 py-2">
                            Mes Établissements
                          </div>
                          {establishments.length === 0 ? <div className="text-sm text-gray-500 px-3 py-2">
                              Aucun établissement enregistré
                            </div> : establishments.map(etab => <Button key={etab.place_id} variant="ghost" className="w-full justify-start p-3 h-auto text-left hover:bg-gray-50" onClick={() => {
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(etab));
                        setSelectedEtab(etab);
                        setShowEstablishmentsDropdown(false);
                        // Déclencher l'événement pour mettre à jour d'autres composants
                        window.dispatchEvent(new CustomEvent(EVT_SAVED, {
                          detail: etab
                        }));
                      }}>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Building2 className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{etab.name}</div>
                                    <div className="text-sm text-gray-500 truncate">{etab.address}</div>
                                  </div>
                                </div>
                              </Button>)}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{selectedEtab.name}</div>
                    <div className="text-sm text-gray-500">{selectedEtab.address}</div>
                  </div>
                </div>
                
                {/* Icône "Importer vos avis" au milieu en bas */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                  
                </div>
                
                {/* Icônes en bas à droite */}
                <div className="absolute bottom-0 right-0 flex gap-1">
                  {/* Bouton analyser établissement */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={async () => {
                      if (!selectedEtab?.place_id) {
                        console.error('Place ID manquant');
                        return;
                      }
                      
                      setIsAnalyzing(true);
                      try {
                        console.log('Démarrage de l\'analyse pour:', selectedEtab.place_id);
                        const { runAnalyze } = await import('@/lib/runAnalyze');
                        const result = await runAnalyze({
                          place_id: selectedEtab.place_id,
                          name: selectedEtab.name,
                          address: selectedEtab.address
                        });
                        
                        if (result.ok) {
                          console.log('Analyse terminée:', result);
                          // Recharger les insights au lieu de recharger toute la page
                          const { data: insightData } = await supabase
                            .from('review_insights')
                            .select('total_count, avg_rating, top_issues, top_praises, positive_ratio, last_analyzed_at, summary, themes')
                            .eq('place_id', selectedEtab.place_id)
                            .eq('user_id', user?.id)
                            .order('last_analyzed_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();
                          
                          if (insightData) {
                            setInsight(insightData);
                            console.log('Insights rechargés:', insightData);
                          }
                          
                          // Recharger aussi les avis
                          const { data: reviewsData } = await supabase
                            .from('reviews')
                            .select('*')
                            .eq('place_id', selectedEtab.place_id)
                            .eq('user_id', user?.id)
                            .order('published_at', { ascending: false });
                            
                          if (reviewsData) {
                            setRecentReviews(reviewsData.slice(0, 3));
                            const bestReviews = reviewsData
                              .filter(r => r.rating && r.rating >= 4)
                              .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                              .slice(0, 5);
                            setTopReviews(bestReviews);
                            const badReviews = reviewsData
                              .filter(r => r.rating && r.rating <= 2)
                              .sort((a, b) => (a.rating || 0) - (b.rating || 0))
                              .slice(0, 5);
                            setWorstReviews(badReviews);
                          }
                          
                          // Recalculer les stats par plateforme
                          if (reviewsData) {
                            const statsByPlatform: Record<string, { count: number; totalRating: number; avgRating: number }> = {};
                            reviewsData.forEach(review => {
                              const source = review.source || 'unknown';
                              if (!statsByPlatform[source]) {
                                statsByPlatform[source] = { count: 0, totalRating: 0, avgRating: 0 };
                              }
                              statsByPlatform[source].count++;
                              if (review.rating) {
                                statsByPlatform[source].totalRating += review.rating;
                              }
                            });
                            Object.keys(statsByPlatform).forEach(source => {
                              const stat = statsByPlatform[source];
                              stat.avgRating = stat.count > 0 ? stat.totalRating / stat.count : 0;
                            });
                            setPlatformStats(statsByPlatform);
                          }
                        } else {
                          console.error('Erreur d\'analyse:', result.error);
                        }
                      } catch (error) {
                        console.error('Erreur lors de l\'analyse:', error);
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }} 
                    disabled={isAnalyzing}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto" 
                    title="Analyser cet établissement"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <BarChart3 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  {/* Bouton oublier établissement */}
                  <Button variant="ghost" size="sm" onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setSelectedEtab(null);
              }} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto" title="Oublier cet établissement">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Historique des analyses */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Historique des analyses</CardTitle>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Les analyses précédentes et terminées. Les résultats</p>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600">{insight?.total_count ?? 0}</span>
                  <div>
                    <div className="font-medium">{date} {time}</div>
                    <div className="text-sm text-gray-500">2h avis</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAvis(!showAvis)} className="hover:bg-blue-50">
                  {showAvis ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                </Button>
              </div>
              
              {showAvis && <div className="mt-4 space-y-3 border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Avis récents :</h4>
                  {recentReviews.length > 0 ? (
                    recentReviews.map((avis) => (
                      <div key={avis.id} className="bg-white p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{avis.author || 'Anonyme'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">{'★'.repeat(Math.round(avis.rating || 0))}</span>
                            <span className="text-xs text-gray-500">{formatReviewDate(avis.published_at)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{avis.text || 'Pas de commentaire'}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">Aucun avis récent disponible</p>
                  )}
                </div>}
            </div>
          </CardContent>
        </Card>

        {/* Métriques */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">{avgRating.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-600">Note moyenne</p>
              <p className="text-xs text-gray-500">Basée sur {totalReviews} avis</p>
              <Button variant="ghost" size="sm" onClick={() => setShowCourbeNote(!showCourbeNote)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-yellow-50">
                {showCourbeNote ? <ChevronUp className="w-3 h-3 text-yellow-600" /> : <ChevronDown className="w-3 h-3 text-yellow-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-blue-600">{totalReviews}</span>
                <TrendingUp className="w-4 h-4 text-green-500 ml-1" />
              </div>
              <p className="text-sm text-gray-600">Total avis</p>
              <p className="text-xs text-gray-500">Tous plateformes</p>
              <Button variant="ghost" size="sm" onClick={() => setShowPlateformes(!showPlateformes)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50">
                {showPlateformes ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-1 mb-2">
                <span className="text-2xl font-bold text-green-600">{positivePct}%</span>
              </div>
              <p className="text-sm text-gray-600">Avis positifs</p>
              <p className="text-xs text-gray-500">Note ≥ 4 étoiles</p>
              <Button variant="ghost" size="sm" onClick={() => setShowAvisPositifs(!showAvisPositifs)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-green-50">
                {showAvisPositifs ? <ChevronUp className="w-3 h-3 text-green-600" /> : <ChevronDown className="w-3 h-3 text-green-600" />}
              </Button>
            </CardContent>
          </Card>

          <Card className="relative">
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
              <Button variant="ghost" size="sm" onClick={() => setShowAvisNegatifs(!showAvisNegatifs)} className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-red-50">
                {showAvisNegatifs ? <ChevronUp className="w-3 h-3 text-red-600" /> : <ChevronDown className="w-3 h-3 text-red-600" />}
              </Button>
            </CardContent>
          </Card>

          
        </div>

        {/* Courbe de progression de la note */}
        {showCourbeNote && <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Évolution de la note moyenne
                  </CardTitle>
                  <p className="text-sm text-gray-600">Progression de votre note depuis l'enregistrement de l'établissement — par {granularityEvolution}</p>
                </div>
                <Select value={granularityEvolution} onValueChange={(value) => setGranularityEvolution(value as Granularity)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="jour">Jour</SelectItem>
                    <SelectItem value="semaine">Semaine</SelectItem>
                    <SelectItem value="mois">Mois</SelectItem>
                    <SelectItem value="année">Année</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {courbeNoteData.length > 0 ? (
                <>
                  {courbeNoteData.length < 2 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">Données limitées pour cette granularité</p>
                      <p className="text-xs text-gray-400 mt-1">Sélectionnez une période plus large ou attendez plus d'avis</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={courbeNoteData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mois" />
                            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                            <Tooltip formatter={value => [`${value}/5`, 'Note moyenne']} />
                            <Line type="monotone" dataKey="note" stroke="#eab308" strokeWidth={3} dot={{
                          fill: '#eab308',
                          strokeWidth: 2,
                          r: 4
                        }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        Date d'enregistrement : {establishmentCreatedAt ? formatRegistrationDate(establishmentCreatedAt) : 'Inconnue'}
                      </p>
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">
                  Aucune donnée disponible pour afficher l'évolution de la note
                </p>
              )}
            </CardContent>
          </Card>}

        {/* Pires avis */}
        {showAvisNegatifs && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Top 5 des mauvais avis
              </CardTitle>
              <p className="text-sm text-gray-600">Les avis les moins bien notés nécessitant votre attention</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {worstReviews.length > 0 ? (
                  worstReviews.map((avis, index) => (
                    <div key={avis.id} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-700">#{index + 1}</span>
                          <span className="font-medium">{avis.author || 'Anonyme'}</span>
                          <span className="text-yellow-500">{'★'.repeat(Math.round(avis.rating || 0))}{'☆'.repeat(5 - Math.round(avis.rating || 0))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{avis.source}</span>
                          <span className="text-xs text-gray-500">{formatReviewDate(avis.published_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{avis.text || 'Pas de commentaire'}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun avis négatif trouvé</p>
                )}
              </div>
            </CardContent>
          </Card>}

        {/* Meilleurs avis */}
        {showAvisPositifs && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Top 5 des meilleurs avis
              </CardTitle>
              <p className="text-sm text-gray-600">Les avis les mieux notés de vos clients</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topReviews.length > 0 ? (
                  topReviews.map((avis, index) => (
                    <div key={avis.id} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-700">#{index + 1}</span>
                          <span className="font-medium">{avis.author || 'Anonyme'}</span>
                          <span className="text-yellow-500">{'★'.repeat(Math.round(avis.rating || 0))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{avis.source}</span>
                          <span className="text-xs text-gray-500">{formatReviewDate(avis.published_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{avis.text || 'Pas de commentaire'}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">Aucun avis positif trouvé</p>
                )}
              </div>
            </CardContent>
          </Card>}

        {/* Plateformes connectées - Affichées en dessous des métriques */}
        {showPlateformes && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">Plateformes connectées</CardTitle>
              <p className="text-sm text-gray-600">Gérer vos présences sur les différentes plateformes</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(platformStats).length > 0 ? (
                  Object.entries(platformStats).map(([source, stats]) => {
                    // Configuration des plateformes
                    const platformConfig: Record<string, { name: string; color: string; initial: string }> = {
                      google: { name: 'Google', color: 'bg-red-100 text-red-600', initial: 'G' },
                      yelp: { name: 'Yelp', color: 'bg-yellow-100 text-yellow-600', initial: 'Y' },
                      tripadvisor: { name: 'TripAdvisor', color: 'bg-green-100 text-green-600', initial: 'T' },
                      facebook: { name: 'Facebook', color: 'bg-blue-100 text-blue-600', initial: 'F' },
                    };
                    
                    const config = platformConfig[source.toLowerCase()] || { 
                      name: source.charAt(0).toUpperCase() + source.slice(1), 
                      color: 'bg-gray-100 text-gray-600', 
                      initial: source.charAt(0).toUpperCase() 
                    };
                    
                    return (
                      <div key={source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config.color}`}>
                            <span className="font-bold">{config.initial}</span>
                          </div>
                          <div>
                            <div className="font-medium">{config.name}</div>
                            <div className="text-sm text-gray-500">
                              {stats.count} avis • {stats.avgRating.toFixed(1)} étoiles
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">Connecté</Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Aucune plateforme connectée</p>
                    <p className="text-xs mt-1">Analysez votre établissement pour voir les plateformes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>}

        {/* Problèmes et Points forts */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Problèmes prioritaires */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-lg">Top 3 Problèmes prioritaires</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${showParetoChart ? 'rotate-180' : ''}`} onClick={() => setShowParetoChart(!showParetoChart)} />
              </div>
              <p className="text-sm text-gray-500">Les plus mentionnés par fréquence et pourcentage en priorité</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {topIssues.length > 0 ? (
                topIssues.slice(0, 3).map((issue: any, index: number) => {
                  const severity = issue.severity || (index === 0 ? 'high' : index === 1 ? 'medium' : 'low');
                  const isCritical = severity === 'high';
                  const mentionCount = issue.count || issue.mentions || 0;
                  const percentage = totalAnalyzed > 0 && mentionCount > 0 
                    ? Math.round((mentionCount / totalAnalyzed) * 100) 
                    : 0;
                  
                  return (
                    <div key={index} className={`flex items-center justify-between p-3 ${isCritical ? 'bg-red-50' : 'bg-yellow-50'} rounded-lg`}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`w-4 h-4 ${isCritical ? 'text-red-500' : 'text-yellow-600'}`} />
                        <div>
                          <div className="font-medium">{issue.theme || issue.issue || 'Problème non spécifié'}</div>
                          <div className="text-sm text-gray-500">
                            {percentage > 0 ? `${percentage}% des avis` : 'Identifié par l\'IA'}
                          </div>
                        </div>
                      </div>
                      <Badge variant={isCritical ? 'destructive' : 'default'} className={!isCritical ? 'bg-yellow-500 text-white' : ''}>
                        {isCritical ? 'Critique' : 'Moyen'}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Aucun problème identifié</p>
                  <p className="text-xs mt-1">Analysez votre établissement pour voir les problèmes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Points forts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">Top 3 Points forts</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${showParetoPoints ? 'rotate-180' : ''}`} onClick={() => setShowParetoPoints(!showParetoPoints)} />
              </div>
              <p className="text-sm text-gray-500">Les points forts les plus mentionnés par vos clients</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {topStrengths.length > 0 ? (
                topStrengths.slice(0, 3).map((strength: any, index: number) => {
                  const mentionCount = strength.count || strength.mentions || 0;
                  const percentage = totalAnalyzed > 0 && mentionCount > 0 
                    ? Math.round((mentionCount / totalAnalyzed) * 100) 
                    : 0;
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <div>
                          <div className="font-medium">{strength.theme || strength.strength || 'Point fort non spécifié'}</div>
                          <div className="text-sm text-gray-500">
                            {percentage > 0 ? `${percentage}% des avis` : 'Identifié par l\'IA'}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white">Force</Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Aucun point fort identifié</p>
                  <p className="text-xs mt-1">Analysez votre établissement pour voir les points forts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Diagramme de Pareto des Points Forts */}
        {showParetoPoints && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Diagramme de Pareto - Analyse des points forts
              </CardTitle>
              <p className="text-sm text-gray-600">Identification des 20% de points forts qui génèrent 80% de la satisfaction</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoPointsData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => {
                  if (name === 'Cumulative') return [`${value}%`, 'Cumul %'];
                  return [value, 'Mentions positives'];
                }} />
                    <Bar yAxisId="left" dataKey="count" fill="hsl(var(--primary))" name="Mentions positives" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(var(--green-600))" strokeWidth={2} dot={{
                  fill: "hsl(var(--green-600))",
                  strokeWidth: 2,
                  r: 4
                }} name="Cumulative" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-500 mt-4">Les barres représentent les mentions positives, la ligne le pourcentage cumulé des forces</p>
            </CardContent>
          </Card>}

        {/* Diagramme de Pareto */}
        {showParetoChart && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Diagramme de Pareto - Analyse des problèmes
              </CardTitle>
              <p className="text-sm text-gray-600">Identification des 20% de causes qui génèrent 80% des problèmes</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoData} margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60
              }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
                    <YAxis yAxisId="left" orientation="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => {
                  if (name === 'Cumulative') return [`${value}%`, 'Cumul %'];
                  return [value, 'Occurrences'];
                }} />
                    <Bar yAxisId="left" dataKey="count" fill="hsl(var(--destructive))" name="Occurrences" />
                    <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} dot={{
                  fill: "hsl(var(--primary))",
                  strokeWidth: 2,
                  r: 4
                }} name="Cumulative" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-gray-500 mt-4">Les barres représentent le nombre d'occurrences, la ligne le pourcentage cumulé</p>
            </CardContent>
          </Card>}

        {/* Recommandations */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">Recommandations actionnables</CardTitle>
            </div>
            <p className="text-sm text-gray-500">Actions concrètes à mettre en place</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insight?.summary?.recommendations && insight.summary.recommendations.length > 0 ? (
                insight.summary.recommendations.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm text-gray-700">{recommendation}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">Aucune recommandation disponible</p>
                  <p className="text-xs mt-1">Analysez votre établissement pour obtenir des recommandations</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analyse par thématiques */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">78%</span>
                <CardTitle className="text-lg">Analyse par thématiques</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowThematiques(!showThematiques)} className="h-6 w-6 p-0 hover:bg-purple-50">
                {showThematiques ? <ChevronUp className="w-3 h-3 text-purple-600" /> : <ChevronDown className="w-3 h-3 text-purple-600" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">Répartition des avis par catégories</p>
          </CardHeader>
          {showThematiques && <CardContent>
              <div className="space-y-4">
                {insight?.themes && insight.themes.length > 0 ? (
                  (() => {
                    const totalReviews = insight?.total_count || 1;
                    
                    // Calculer les pourcentages bruts
                    const themesWithPercentages = insight.themes.map((theme: any) => {
                      const themeCount = theme.count || 0;
                      const rawPercentage = (themeCount / totalReviews) * 100;
                      
                      // Calculer positifs et négatifs pour cette thématique
                      // On suppose que theme.reviews contient les avis de cette thématique
                      // Sinon, on utilise recentReviews pour estimer
                      let positiveCount = 0;
                      let negativeCount = 0;
                      
                      if (theme.reviews && Array.isArray(theme.reviews)) {
                        theme.reviews.forEach((review: any) => {
                          const rating = review.rating || 0;
                          if (rating >= 4) positiveCount++;
                          else if (rating <= 2) negativeCount++;
                        });
                      } else {
                        // Estimation basée sur la proportion globale
                        const globalPositiveRatio = insight?.positive_ratio || 0.7;
                        positiveCount = Math.round(themeCount * globalPositiveRatio);
                        negativeCount = Math.round(themeCount * (1 - globalPositiveRatio));
                      }
                      
                      const totalCounted = positiveCount + negativeCount;
                      const positivePercent = totalCounted > 0 ? Math.round((positiveCount / totalCounted) * 100) : 0;
                      const negativePercent = totalCounted > 0 ? Math.round((negativeCount / totalCounted) * 100) : 0;
                      
                      return {
                        ...theme,
                        rawPercentage,
                        positivePercent,
                        negativePercent
                      };
                    });
                    
                    // Calculer la somme totale pour normalisation
                    const totalPercentage = themesWithPercentages.reduce((sum: number, t: any) => sum + t.rawPercentage, 0);
                    
                    // Normaliser pour que la somme fasse 100%
                    const themesNormalized = themesWithPercentages.map((theme: any) => ({
                      ...theme,
                      percentage: totalPercentage > 0 ? Math.round((theme.rawPercentage / totalPercentage) * 100) : 0
                    }));
                    
                    // Choose icon based on theme name
                    const getThemeIcon = (themeName: string) => {
                      const name = themeName.toLowerCase();
                      if (name.includes('cuisine') || name.includes('plat') || name.includes('nourriture')) {
                        return <UtensilsCrossed className="w-4 h-4 text-purple-500" />;
                      } else if (name.includes('service') || name.includes('personnel') || name.includes('accueil')) {
                        return <Users className="w-4 h-4 text-purple-500" />;
                      } else if (name.includes('ambiance') || name.includes('atmosphère') || name.includes('décor')) {
                        return <Wine className="w-4 h-4 text-purple-500" />;
                      } else if (name.includes('emplacement') || name.includes('localisation') || name.includes('lieu')) {
                        return <MapPin className="w-4 h-4 text-purple-500" />;
                      }
                      return <BarChart3 className="w-4 h-4 text-purple-500" />;
                    };

                    const SentimentBadges: React.FC<{ positivePct?: number; negativePct?: number; className?: string }> = ({ positivePct, negativePct, className }) => {
                      const clampPct = (n?: number) => {
                        if (typeof n !== "number" || isNaN(n)) return 0;
                        return Math.max(0, Math.min(100, Math.round(n)));
                      };
                      const p = clampPct(positivePct);
                      const n = clampPct(negativePct);
                      return (
                        <div className={`flex items-center gap-2 ${className ?? ""}`}>
                          <span
                            title="Positifs"
                            className="inline-flex items-center justify-center min-w-[48px] h-9 px-3 rounded-xl text-sm font-semibold shadow-sm bg-green-50 text-green-600"
                          >
                            {p}%
                          </span>
                          <span
                            title="Négatifs"
                            className="inline-flex items-center justify-center min-w-[48px] h-9 px-3 rounded-xl text-sm font-semibold shadow-sm bg-red-50 text-red-600"
                          >
                            {n}%
                          </span>
                        </div>
                      );
                    };

                    return themesNormalized.map((theme: any, index: number) => (
                      <div key={index} className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getThemeIcon(theme.theme)}
                          <div className="flex-1">
                            <div className="font-medium">{theme.theme}</div>
                            <div className="text-sm text-gray-500">{theme.percentage}% des avis</div>
                          </div>
                          <div className="ml-auto">
                            <SentimentBadges
                              positivePct={theme.positivePercent}
                              negativePct={theme.negativePercent}
                            />
                          </div>
                        </div>
                      </div>
                    ));
                  })()
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">Aucune thématique identifiée</p>
                    <p className="text-xs mt-1">Analysez votre établissement pour voir les thématiques</p>
                  </div>
                )}
              </div>
            </CardContent>}
        </Card>

        {/* Réponse automatique */}
        <Card className="relative mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  <Info className="w-6 h-6" />
                </span>
                <CardTitle className="text-lg">Réponse automatique</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowReponseAuto(!showReponseAuto)} className="h-6 w-6 p-0 hover:bg-purple-50">
                {showReponseAuto ? <ChevronUp className="w-3 h-3 text-purple-600" /> : <ChevronDown className="w-3 h-3 text-purple-600" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">Système automatisé aux avis clients</p>
          </CardHeader>
          {showReponseAuto && <CardContent>
              <div className="space-y-4">
                {pendingReviews.length > 0 ? (
                  pendingReviews.slice(0, 5).map((review: any, index: number) => {
                    const rating = review.rating || 0;
                    const isPositive = rating >= 4;
                    const authorName = review.author || 'Anonyme';
                    const reviewText = review.text || 'Pas de commentaire';
                    const reviewId = review.id || `review-${index}`;
                    
                    // Générer une réponse automatique simple basée sur le rating
                    const defaultResponse = isPositive
                      ? `Merci ${authorName.split(' ')[0]} pour votre retour positif ! Nous sommes ravis que vous ayez apprécié votre expérience chez nous. Au plaisir de vous revoir bientôt !`
                      : `Bonjour ${authorName.split(' ')[0]}, nous vous présentons nos excuses pour cette expérience décevante. Vos remarques sont précieuses et nous allons améliorer nos services. N'hésitez pas à nous recontacter directement.`;
                    
                    const currentResponse = editedResponses[reviewId] || defaultResponse;
                    const isEditing = editingReviewId === reviewId;
                    
                    return (
                      <div key={reviewId} className="border rounded-lg p-4 bg-gray-50 transition-all duration-300">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{authorName}</span>
                            <div className="flex items-center ml-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star 
                                  key={star} 
                                  className={`w-3 h-3 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <Badge variant="outline" className={isPositive ? "text-green-600 border-green-600" : "text-orange-600 border-orange-600"}>
                            À valider
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">"{reviewText.substring(0, 150)}{reviewText.length > 150 ? '...' : ''}"</p>
                        <div className="bg-white border-l-4 border-purple-500 p-3 rounded">
                          <p className="text-sm text-gray-600 font-medium mb-1">Réponse automatique proposée :</p>
                          {isEditing ? (
                            <textarea
                              value={currentResponse}
                              onChange={(e) => setEditedResponses(prev => ({ ...prev, [reviewId]: e.target.value }))}
                              className="w-full text-sm text-gray-700 border rounded p-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                          ) : (
                            <p className="text-sm text-gray-700">{currentResponse}</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3 items-center justify-between">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                  onClick={() => setEditingReviewId(null)}
                                >
                                  Enregistrer
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditedResponses(prev => {
                                      const newResponses = { ...prev };
                                      delete newResponses[reviewId];
                                      return newResponses;
                                    });
                                    setEditingReviewId(null);
                                  }}
                                >
                                  Annuler
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  disabled={isValidatingReview[reviewId]}
                                  onClick={async () => {
                                    try {
                                      if (!user?.id || !selectedEtab?.place_id) {
                                        toast.error('Erreur', {
                                          description: 'Utilisateur ou établissement non défini',
                                          duration: 4000
                                        });
                                        return;
                                      }
                                      
                                      setIsValidatingReview(prev => ({ ...prev, [reviewId]: true }));
                                      
                                      // Utiliser le module reponses.ts avec les bons paramètres
                                      await validateReponse({
                                        avisId: reviewId.toString(),
                                        contenu: currentResponse,
                                        etablissementId: selectedEtab.place_id,
                                        userId: user.id
                                      });
                                      
                                      // Optimistic update : retirer la carte de la liste
                                      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
                                      
                                      // Marquer comme validée localement
                                      setValidatedReviews(prev => new Set([...prev, reviewId]));
                                      
                                      // Afficher le toast de succès
                                      toast.success('Réponse validée et enregistrée ✅', {
                                        description: 'La réponse a bien été enregistrée.',
                                        duration: 3000
                                      });
                                      
                                      // Déclencher l'événement pour mettre à jour le compteur
                                      window.dispatchEvent(new CustomEvent('response-validated', {
                                        detail: { placeId: selectedEtab.place_id }
                                      }));
                                    } catch (error: any) {
                                      console.error('validateReponse', error);
                                      toast.error('Échec de l\'enregistrement', {
                                        description: error.message || 'Une erreur est survenue.',
                                        duration: 4000
                                      });
                                    } finally {
                                      setIsValidatingReview(prev => ({ ...prev, [reviewId]: false }));
                                    }
                                  }}
                                >
                                  {isValidatingReview[reviewId] ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                      Validation...
                                    </>
                                  ) : (
                                    'Valider'
                                  )}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingReviewId(reviewId);
                                    if (!editedResponses[reviewId]) {
                                      setEditedResponses(prev => ({ ...prev, [reviewId]: defaultResponse }));
                                    }
                                  }}
                                >
                                  Modifier
                                </Button>
                              </>
                            )}
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(currentResponse);
                              toast.success("Copié !", {
                                description: "La réponse a été copiée dans le presse-papier.",
                              });
                            }}
                            title="Copier la réponse"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="text-lg font-medium text-gray-900">Plus d'avis à valider 🎉</p>
                    <p className="text-sm mt-1">Toutes les réponses ont été validées !</p>
                  </div>
                )}
              </div>
            </CardContent>}
        </Card>
      </div>
    </div>;
};
export default Dashboard;