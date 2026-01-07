import { AnalyseDashboard } from "@/components/AnalyseDashboard";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart3, TrendingUp, User, LogOut, Home, Eye, Trash2, AlertTriangle, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, ChevronRight, Building2, Star, UtensilsCrossed, Wine, Users, MapPin, Clock, MessageSquare, Info, Loader2, Copy, Calendar, Download, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthProvider";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { Etab, STORAGE_KEY, EVT_SAVED, STORAGE_KEY_LIST } from "@/types/etablissement";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, BarChart, Area, PieChart, Pie, Cell, Legend } from 'recharts';
import { getRatingEvolution, formatRegistrationDate, Granularity } from "@/utils/ratingEvolution";
import { validateReponse } from "@/lib/reponses";
import { generatePdfReport } from "@/utils/generatePdfReport";
import { extractOriginalText } from "@/utils/extractOriginalText";
import { useTranslation } from "react-i18next";


const Dashboard = () => {
  const { t } = useTranslation();
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
  const [showAnalyseDetaillee, setShowAnalyseDetaillee] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [showRecommandations, setShowRecommandations] = useState(false);
  const [showReponseAuto, setShowReponseAuto] = useState(false);
  const [showParetoChart, setShowParetoChart] = useState(false);
  const [showParetoPoints, setShowParetoPoints] = useState(false);
  const [granularityEvolution, setGranularityEvolution] = useState<Granularity>("mois");
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Établissement sélectionné (depuis DB)
  const [selectedEtab, setSelectedEtab] = useState<Etab | null>(null);

  // Liste des établissements enregistrés (depuis DB)
  const [establishments, setEstablishments] = useState<Etab[]>([]);
  const [showEstablishmentsDropdown, setShowEstablishmentsDropdown] = useState(false);
  const [establishmentsLoading, setEstablishmentsLoading] = useState(true);

  // Charger les établissements depuis la DB (source de vérité unique)
  const loadEstablishmentsFromDB = async () => {
    if (!user?.id) {
      setEstablishmentsLoading(false);
      return;
    }

    setEstablishmentsLoading(true);
    try {
      const { data, error } = await supabase
        .from("établissements")
        .select("id, place_id, nom, adresse, is_active, lat, lng, website, telephone, rating, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mapped: Etab[] = (data ?? []).map((row) => ({
        place_id: row.place_id,
        name: row.nom,
        address: row.adresse ?? "",
        lat: row.lat ?? null,
        lng: row.lng ?? null,
        website: row.website ?? undefined,
        phone: row.telephone ?? undefined,
        rating: row.rating ?? null,
        is_active: row.is_active ?? false,
      }));

      setEstablishments(mapped);

      // Détermine l'établissement affiché: actif si défini, sinon plus récent
      if (mapped.length > 0) {
        const active = mapped.find((e) => e.is_active) ?? mapped[0];
        setSelectedEtab(active);
      } else {
        setSelectedEtab(null);
      }
    } catch (err) {
      console.error("[Dashboard] Erreur chargement établissements:", err);
      setEstablishments([]);
    } finally {
      setEstablishmentsLoading(false);
    }
  };

  useEffect(() => {
    loadEstablishmentsFromDB();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Écouter les événements de mise à jour
  useEffect(() => {
    const onUpdated = () => loadEstablishmentsFromDB();
    window.addEventListener(EVT_SAVED, onUpdated);
    window.addEventListener("establishment:updated", onUpdated);
    return () => {
      window.removeEventListener(EVT_SAVED, onUpdated);
      window.removeEventListener("establishment:updated", onUpdated);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Synchroniser avec le store si mis à jour
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
  
  // Index de l'avis actuellement affiché dans le module "Réponse automatique" (mode file d'attente)
  const [currentReviewIndex, setCurrentReviewIndex] = useState<number>(0);
  
  // État pour le téléchargement du rapport
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  
  // ID de l'établissement dans la base de données
  const [establishmentDbId, setEstablishmentDbId] = useState<string | null>(null);

  // État pour la génération des réponses IA
  const [isGeneratingResponse, setIsGeneratingResponse] = useState<Record<string, boolean>>({});
  const [aiGeneratedResponses, setAiGeneratedResponses] = useState<Record<string, string>>({});

  // Mocked data for Pareto charts (will be updated below after variables are declared)
  const defaultParetoData = [{
    name: t("charts.problems.slowService"),
    count: 45,
    percentage: 32.1,
    cumulative: 32.1
  }, {
    name: t("charts.problems.coldFood"),
    count: 38,
    percentage: 27.1,
    cumulative: 59.2
  }, {
    name: t("charts.problems.longWait"),
    count: 25,
    percentage: 17.9,
    cumulative: 77.1
  }];
  const defaultParetoPointsData = [{
    name: t("charts.strengths.tasteQuality"),
    count: 52,
    percentage: 35.4,
    cumulative: 35.4
  }, {
    name: t("charts.strengths.fastService"),
    count: 41,
    percentage: 27.9,
    cumulative: 63.3
  }, {
    name: t("charts.strengths.niceAmbiance"),
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
          if (!import.meta.env.PROD) {
            console.log('[dashboard] Insights loaded:', insightData);
          }
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
          // Si pas d'avis, réinitialiser tous les états
          if (reviewsData.length === 0) {
            setRecentReviews([]);
            setAllReviewsForChart([]);
            setTopReviews([]);
            setWorstReviews([]);
            setPlatformStats({});
            setPendingReviews([]);
            // Reset insight si plus d'avis
            setInsight(null);
          } else {
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
              const source = review.source || 'google';
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
                const pending = reviewsData.filter(review => !validatedSet.has(review.id));
                setPendingReviews(pending);
              }
            }
          }
        }

        // Récupérer la date de création et l'id de l'établissement
        const { data: establishmentData, error: estError } = await supabase
          .from('establishments')
          .select('id, created_at')
          .eq('place_id', currentEstab.place_id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!import.meta.env.PROD) {
          console.log('[Dashboard] Récupération établissement:', {
            place_id: currentEstab.place_id,
            user_id: user.id,
            found: !!establishmentData,
            error: estError,
            data: establishmentData
          });
        }
        
        if (!estError && establishmentData) {
          setEstablishmentCreatedAt(establishmentData.created_at);
          setEstablishmentDbId(establishmentData.id);
          if (!import.meta.env.PROD) {
            console.log('[Dashboard] ✅ Établissement ID récupéré:', establishmentData.id);
          }
        } else {
          console.warn('[Dashboard] ⚠️ Établissement non trouvé dans la base pour:', {
            place_id: currentEstab.place_id,
            user_id: user.id,
            error: estError
          });
          setEstablishmentDbId(null);
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
      } catch (error) {
        console.error('[dashboard] fetch insights error:', error);
      } finally {
        setIsLoadingInsight(false);
      }
    };
    fetchInsights();
    
    // Listen to reviews:imported event to reload data
    const handleReviewsImported = () => {
      fetchInsights();
    };
    
    window.addEventListener('reviews:imported', handleReviewsImported);
    
    return () => {
      window.removeEventListener('reviews:imported', handleReviewsImported);
    };
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
  // Utiliser 0 ou des valeurs par défaut quand il n'y a pas d'avis
  const hasReviews = allReviewsForChart.length > 0;
  const totalAnalyzed = insight?.total_count ?? 0;
  const avgRating = hasReviews ? (insight?.avg_rating ?? 0) : 0;
  const totalReviews = hasReviews ? (insight?.total_count ?? 0) : 0;
  const positivePct = hasReviews && insight?.positive_ratio != null ? Math.round(insight.positive_ratio * 100) : 0;
  const negativePct = hasReviews ? (100 - positivePct) : 0;
  const topIssues = hasReviews ? (insight?.top_issues ?? []) : [];
  const topStrengths = hasReviews ? (insight?.top_praises ?? []) : [];

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
    if (!dateStr) return t("dashboard.unknownDate");
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
      {/* Main content */}
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Dashboard d'analyse</h1>
            </div>
            {/* Bouton Télécharger le rapport */}
            {(selectedEtab || selectedEstablishment) && (
              <Button
                className="download-report-btn"
                onClick={() => {
                  if (!import.meta.env.PROD) {
                    console.log('[Dashboard] 🔘 Clic sur Télécharger le rapport PDF');
                  }
                  
                  const currentEstab = selectedEtab || selectedEstablishment;
                  if (!currentEstab) {
                    toast.error(t("common.error"), {
                      description: t("establishment.noEstablishmentSelected"),
                    });
                    return;
                  }

                  if (!hasReviews || allReviewsForChart.length === 0) {
                    toast.info(t("dashboard.noReportAvailable"), {
                      description: t("dashboard.importReviewsToGenerateReport"),
                    });
                    return;
                  }

                  setIsDownloadingReport(true);

                  try {
                    // Préparer les données pour le PDF
                    const reportData = {
                      establishmentName: currentEstab.name || 'Établissement',
                      totalReviews: totalAnalyzed || allReviewsForChart.length,
                      avgRating: avgRating,
                      positiveRatio: positivePct / 100,
                      topIssues: topIssues,
                      topStrengths: topStrengths,
                      themes: insight?.themes || [],
                      recentReviews: allReviewsForChart,
                      summary: insight?.summary || '',
                    };

                    if (!import.meta.env.PROD) {
                      console.log('[Dashboard] 📄 Génération du PDF avec:', reportData);
                    }

                    // Générer et télécharger le PDF
                    generatePdfReport(reportData);

                    toast.success(t("dashboard.reportDownloaded"), {
                      description: t("dashboard.reportGeneratedSuccess"),
                    });
                  } catch (error) {
                    console.error('[Dashboard] ❌ Erreur génération PDF:', error);
                    toast.error(t("common.error"), {
                      description: t("dashboard.reportGenerationError"),
                    });
                  } finally {
                    setIsDownloadingReport(false);
                  }
                }}
              >
                {isDownloadingReport ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Télécharger le rapport
                  </>
                )}
              </Button>
            )}
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
                        <Button variant="ghost" size="sm" className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-600 p-0.5 h-auto w-auto bg-white border border-gray-200 rounded-full shadow-sm" title={t("establishment.chooseAnotherEstablishment")}>
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-2 bg-white z-50 shadow-lg border" align="start">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-700 px-3 py-2">
                            {t("establishment.myEstablishments")}
                          </div>
                          {establishmentsLoading ? (
                            <div className="text-sm text-gray-500 px-3 py-2 flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {t("common.loading")}
                            </div>
                          ) : establishments.length === 0 ? (
                            <div className="text-sm text-gray-500 px-3 py-2">
                              {t("establishment.noEstablishmentsSaved")}
                            </div>
                          ) : establishments.map(etab => (
                            <button
                              key={etab.place_id}
                              type="button"
                              className={`w-full flex items-center gap-3 p-3 text-left rounded-lg cursor-pointer transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedEtab?.place_id === etab.place_id ? 'bg-blue-50' : ''
                              }`}
                              onClick={async () => {
                                // Persist en DB : marquer comme actif
                                if (user?.id) {
                                  try {
                                    // D'abord désactiver tous les établissements
                                    await supabase
                                      .from("établissements")
                                      .update({ is_active: false })
                                      .eq("user_id", user.id);
                                    
                                    // Puis activer celui sélectionné
                                    await supabase
                                      .from("établissements")
                                      .update({ is_active: true })
                                      .eq("user_id", user.id)
                                      .eq("place_id", etab.place_id);
                                  } catch (err) {
                                    console.error(t("errors.updateEstablishmentActiveError"), err);
                                  }
                                }
                                
                                setSelectedEtab(etab);
                                setShowEstablishmentsDropdown(false);
                                
                                // Déclencher les événements pour mettre à jour d'autres composants
                                window.dispatchEvent(new CustomEvent(EVT_SAVED, { detail: etab }));
                                window.dispatchEvent(new CustomEvent("establishment:updated"));
                              }}
                            >
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 truncate">{etab.name}</span>
                                  {selectedEtab?.place_id === etab.place_id && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{t("establishment.active")}</span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-500 truncate">{etab.address}</div>
                              </div>
                            </button>
                          ))}
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
                        console.error(t("errors.missingPlaceId"));
                        return;
                      }
                      
                      setIsAnalyzing(true);
                      try {
                        console.log(t("dashboard.startingAnalysis"), selectedEtab.place_id);
                        const { runAnalyze } = await import('@/lib/runAnalyze');
                        const result = await runAnalyze({
                          place_id: selectedEtab.place_id,
                          name: selectedEtab.name,
                          address: selectedEtab.address
                        });
                        
                        if (result.ok) {
                          console.log(t("dashboard.analysisComplete"), result);
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
                            console.log(t("dashboard.insightsReloaded"), insightData);
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
                          console.error(t("dashboard.analysisError"), result.error);
                        }
                      } catch (error) {
                        console.error(t("dashboard.analysisErrorDuring"), error);
                      } finally {
                        setIsAnalyzing(false);
                      }
                    }} 
                    disabled={isAnalyzing}
                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-1 h-auto" 
                    title={t("establishment.analyzeThisEstablishment")}
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
              }} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto" title={t("establishment.forgetThisEstablishment")}>
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
                <CardTitle className="text-lg">{t("dashboard.analysisHistory")}</CardTitle>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{t("dashboard.previousAnalysesDescription")}</p>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600">{insight?.total_count ?? 0}</span>
                  <div>
                    <div className="font-medium">{date} {time}</div>
                    <div className="text-sm text-gray-500">{t("dashboard.reviewsCount", { count: insight?.total_count ?? 0 })}</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAvis(!showAvis)} className="hover:bg-blue-50">
                  {showAvis ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                </Button>
              </div>
              
              {showAvis && <div className="mt-4 space-y-3 border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">{t("dashboard.recentReviews")}</h4>
                  {recentReviews.length > 0 ? (
                    recentReviews.map((avis) => (
                      <div key={avis.id} className="bg-white p-3 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{avis.author || t("dashboard.anonymous")}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-500">{'★'.repeat(Math.round(avis.rating || 0))}</span>
                            <span className="text-xs text-gray-500">{formatReviewDate(avis.published_at)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">{extractOriginalText(avis.text) || t("dashboard.noComment")}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-2">{t("dashboard.noRecentReviewsAvailable")}</p>
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
              <p className="text-sm text-gray-600">{t("dashboard.averageRating")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.basedOnReviews", { count: totalReviews })}</p>
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
              <p className="text-sm text-gray-600">{t("dashboard.totalReviews")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.allPlatforms")}</p>
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
              <p className="text-sm text-gray-600">{t("dashboard.positiveReviews")}</p>
              <p className="text-xs text-gray-500">{t("dashboard.rating4StarsOrMore")}</p>
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
                  <div className="text-sm text-gray-500">{t("dashboard.negativeReviews")}</div>
                  <div className="text-2xl font-bold">{negativePct}%</div>
                  <div className="text-xs text-gray-400">{t("dashboard.negativeReviews")}</div>
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
                    {t("dashboard.averageRatingEvolution")}
                  </CardTitle>
                  <p className="text-sm text-gray-600">{t("dashboard.ratingProgressionDescription", { granularity: granularityEvolution })}</p>
                </div>
                <Select value={granularityEvolution} onValueChange={(value) => setGranularityEvolution(value as Granularity)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-50">
                    <SelectItem value="jour">{t("dashboard.day")}</SelectItem>
                    <SelectItem value="semaine">{t("dashboard.week")}</SelectItem>
                    <SelectItem value="mois">{t("dashboard.month")}</SelectItem>
                    <SelectItem value="année">{t("dashboard.year")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {courbeNoteData.length > 0 ? (
                <>
                  {courbeNoteData.length < 2 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">{t("dashboard.limitedDataForGranularity")}</p>
                      <p className="text-xs text-gray-400 mt-1">{t("dashboard.selectWiderPeriodOrWait")}</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={courbeNoteData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mois" />
                            <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                            <Tooltip formatter={value => [`${value}/5`, t("dashboard.averageRating")]} />
                            <Line type="monotone" dataKey="note" stroke="#eab308" strokeWidth={3} dot={{
                          fill: '#eab308',
                          strokeWidth: 2,
                          r: 4
                        }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <p className="text-sm text-gray-500 mt-4">
                        {t("dashboard.registrationDate")}: {establishmentCreatedAt ? formatRegistrationDate(establishmentCreatedAt) : t("dashboard.unknown")}
                      </p>
                    </>
                  )}
                </>
              ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                  {t("dashboard.noDataForRatingEvolution")}
                </p>
              )}
            </CardContent>
          </Card>}

        {/* Pires avis */}
        {showAvisNegatifs && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {t("dashboard.top5WorstReviews")}
              </CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.worstReviewsDescription")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {worstReviews.length > 0 ? (
                  worstReviews.map((avis, index) => (
                    <div key={avis.id} className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-red-700">#{index + 1}</span>
                          <span className="font-medium">{avis.author || t("dashboard.anonymous")}</span>
                          <span className="text-yellow-500">{'★'.repeat(Math.round(avis.rating || 0))}{'☆'.repeat(5 - Math.round(avis.rating || 0))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{avis.source}</span>
                          <span className="text-xs text-gray-500">{formatReviewDate(avis.published_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{extractOriginalText(avis.text) || t("dashboard.noComment")}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">{t("dashboard.noNegativeReviewsFound")}</p>
                )}
              </div>
            </CardContent>
          </Card>}

        {/* Meilleurs avis */}
        {showAvisPositifs && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {t("dashboard.top5BestReviews")}
              </CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.bestReviewsDescription")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topReviews.length > 0 ? (
                  topReviews.map((avis, index) => (
                    <div key={avis.id} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-green-700">#{index + 1}</span>
                          <span className="font-medium">{avis.author || t("dashboard.anonymous")}</span>
                          <span className="text-yellow-500">{'★'.repeat(Math.round(avis.rating || 0))}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">{avis.source}</span>
                          <span className="text-xs text-gray-500">{formatReviewDate(avis.published_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 italic">"{extractOriginalText(avis.text) || t("dashboard.noComment")}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">{t("dashboard.noPositiveReviewsFound")}</p>
                )}
              </div>
            </CardContent>
          </Card>}

        {/* Plateformes connectées - Affichées en dessous des métriques */}
        {showPlateformes && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-xl">{t("dashboard.connectedPlatforms")}</CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.managePlatformPresences")}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(platformStats).length > 0 ? (
                  Object.entries(platformStats).map(([source, stats]) => {
                    // Configuration des plateformes
                    const platformConfig: Record<string, { name: string; color: string; initial: string }> = {
                      google: { name: t("platforms.google"), color: 'bg-red-100 text-red-600', initial: 'G' },
                      yelp: { name: t("platforms.yelp"), color: 'bg-yellow-100 text-yellow-600', initial: 'Y' },
                      tripadvisor: { name: t("platforms.tripadvisor"), color: 'bg-green-100 text-green-600', initial: 'T' },
                      facebook: { name: t("platforms.facebook"), color: 'bg-blue-100 text-blue-600', initial: 'F' },
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
                              {t("dashboard.reviewsAndStars", { count: stats.count, rating: stats.avgRating.toFixed(1) })}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">{t("dashboard.connected")}</Badge>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">{t("dashboard.noPlatformConnected")}</p>
                    <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeePlatforms")}</p>
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
                  <CardTitle className="text-lg">{t("dashboard.top3PriorityProblems")}</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${showParetoChart ? 'rotate-180' : ''}`} onClick={() => setShowParetoChart(!showParetoChart)} />
              </div>
              <p className="text-sm text-gray-500">{t("dashboard.mostMentionedByFrequency")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasReviews ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium">{t("dashboard.noReviewsAvailable")}</p>
                  <p className="text-xs mt-1">{t("dashboard.importReviewsToSeeProblems")}</p>
                </div>
              ) : topIssues.length > 0 ? (
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
                          <div className="font-medium">{issue.theme || issue.issue || t("dashboard.unspecifiedProblem")}</div>
                          <div className="text-sm text-gray-500">
                            {percentage > 0 ? t("dashboard.percentageOfReviews", { percentage }) : t("dashboard.identifiedByAI")}
                          </div>
                        </div>
                      </div>
                      <Badge variant={isCritical ? 'destructive' : 'default'} className={!isCritical ? 'bg-yellow-500 text-white' : ''}>
                        {isCritical ? t("dashboard.critical") : t("dashboard.medium")}
                      </Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">{t("dashboard.noProblemsIdentified")}</p>
                  <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeeProblems")}</p>
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
                  <CardTitle className="text-lg">{t("dashboard.top3Strengths")}</CardTitle>
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground cursor-pointer transition-transform ${showParetoPoints ? 'rotate-180' : ''}`} onClick={() => setShowParetoPoints(!showParetoPoints)} />
              </div>
              <p className="text-sm text-gray-500">{t("dashboard.mostMentionedStrengths")}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {!hasReviews ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium">{t("dashboard.noReviewsAvailable")}</p>
                  <p className="text-xs mt-1">{t("dashboard.importReviewsToSeeStrengths")}</p>
                </div>
              ) : topStrengths.length > 0 ? (
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
                          <div className="font-medium">{strength.theme || strength.strength || t("dashboard.unspecifiedStrength")}</div>
                          <div className="text-sm text-gray-500">
                            {percentage > 0 ? t("dashboard.percentageOfReviews", { percentage }) : t("dashboard.identifiedByAI")}
                          </div>
                        </div>
                      </div>
                      <Badge className="bg-green-500 text-white">{t("dashboard.strength")}</Badge>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">{t("dashboard.noStrengthsIdentified")}</p>
                  <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeeStrengths")}</p>
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
                {t("dashboard.paretoStrengths")}
              </CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.paretoStrengthsDescription")}</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {(() => {
                  // Helper pour espaces insécables
                  const nbsp = (s: string) => s.split(" ").join("\u00A0");
                  
                  // Mapping couleurs pour points forts (identique aux autres graphiques)
                  const getStrengthColor = (name: string): string => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('qualité') || lowerName.includes('goût') || lowerName.includes('gout') || lowerName.includes('plat')) {
                      return 'hsl(142, 76%, 36%)'; // Vert
                    }
                    if (lowerName.includes('ambiance') || lowerName.includes('cadre') || lowerName.includes('décor')) {
                      return 'hsl(221, 83%, 53%)'; // Bleu
                    }
                    if (lowerName.includes('service') || lowerName.includes('accueil') || lowerName.includes('personnel')) {
                      return 'hsl(280, 65%, 60%)'; // Violet
                    }
                    if (lowerName.includes('rapport') || lowerName.includes('prix')) {
                      return 'hsl(45, 93%, 47%)'; // Jaune
                    }
                    return 'hsl(142, 76%, 36%)'; // Fallback vert
                  };
                  
                  return (
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
                        <Tooltip 
                          cursor={false}
                          formatter={(value, name) => {
                            if (name === 'Cumulative') return [`${value}%`, t("dashboard.cumulativePercent")];
                            return [value, t("dashboard.positiveMentions")];
                          }} 
                        />
                        <Bar yAxisId="left" dataKey="count" name={t("dashboard.positiveMentions")}>
                          {paretoPointsData.map((entry: any, index: number) => (
                            <Cell key={`pareto-strength-${index}`} fill={getStrengthColor(entry.name)} />
                          ))}
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(215, 16%, 47%)" strokeWidth={2} dot={{
                          fill: "hsl(215, 16%, 47%)",
                          strokeWidth: 2,
                          r: 4
                        }} name="Cumulative" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <p className="text-sm text-gray-500 mt-1 mb-0 leading-tight">{t("dashboard.barRepresentsStrengths")}</p>
              
              {/* Camembert + Barres - Répartition des points forts */}
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3 mt-0">{t("dashboard.strengthsDistribution")}</h4>
                {(() => {
                  const strengthPieData = paretoPointsData.map((item: any) => ({
                    name: item.name,
                    value: item.count
                  }));
                  const strengthTotal = strengthPieData.reduce((sum: number, item: any) => sum + item.value, 0);
                  
                  // Helper pour espaces insécables
                  const nbsp = (s: string) => s.split(" ").join("\u00A0");
                  
                  // Mapping couleurs pour points forts: Vert (qualité), Bleu (ambiance), Violet (autre)
                  const getStrengthColor = (name: string): string => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('qualité') || lowerName.includes('goût') || lowerName.includes('gout') || lowerName.includes('plat')) {
                      return 'hsl(142, 76%, 36%)'; // Vert
                    }
                    if (lowerName.includes('ambiance') || lowerName.includes('cadre') || lowerName.includes('décor')) {
                      return 'hsl(221, 83%, 53%)'; // Bleu
                    }
                    if (lowerName.includes('service') || lowerName.includes('accueil') || lowerName.includes('personnel')) {
                      return 'hsl(280, 65%, 60%)'; // Violet
                    }
                    if (lowerName.includes('rapport') || lowerName.includes('prix')) {
                      return 'hsl(45, 93%, 47%)'; // Jaune
                    }
                    return 'hsl(142, 76%, 36%)'; // Fallback vert
                  };
                  
                  if (strengthTotal === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {t("dashboard.noDataForCharts")}
                      </p>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Camembert */}
                      <div>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={strengthPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={{
                                stroke: 'currentColor',
                                strokeWidth: 1
                              }}
                              outerRadius={95}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 30;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const labelText = `${nbsp(name)}\u00A0(${(percent * 100).toFixed(0)}%)`;
                                const color = getStrengthColor(name);
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill={color}
                                    textAnchor={x > cx ? 'start' : 'end'}
                                    dominantBaseline="central"
                                    fontSize={10}
                                    fontWeight={500}
                                    style={{ whiteSpace: 'nowrap' }}
                                  >
                                    {labelText}
                                  </text>
                                );
                              }}
                            >
                              {strengthPieData.map((entry: any, index: number) => (
                                <Cell key={`strength-cell-${index}`} fill={getStrengthColor(entry.name)} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name: string) => {
                                const pct = strengthTotal > 0 ? ((value / strengthTotal) * 100).toFixed(1) : 0;
                                return [`${value} mentions (${pct}%)`, name];
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Diagramme en barres verticales */}
                      <div>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={strengthPieData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                            <XAxis 
                              dataKey="name" 
                              interval={0}
                              height={50}
                              tick={(props: any) => {
                                const { x, y, payload } = props;
                                const value = nbsp(String(payload?.value ?? ""));
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    dy={16}
                                    textAnchor="middle"
                                    fill="#6b7280"
                                    fontSize={9}
                                    style={{ pointerEvents: "none" }}
                                  >
                                    {value}
                                  </text>
                                );
                              }}
                            />
                            <YAxis hide />
                            <Tooltip 
                              cursor={false}
                              formatter={(value: number, name: string) => {
                                const pct = strengthTotal > 0 ? ((value / strengthTotal) * 100).toFixed(1) : 0;
                                return [`${value} ${t("dashboard.mentions")} (${pct}%)`, t("dashboard.mentions")];
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fill: 'hsl(var(--foreground))' }}>
                              {strengthPieData.map((entry: any, index: number) => (
                                <Cell key={`strength-bar-${index}`} fill={getStrengthColor(entry.name)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Légende globale sous les graphiques */}
                <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(142, 76%, 36%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.strengths.tasteQuality")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(221, 83%, 53%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.strengths.niceAmbiance")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(280, 65%, 60%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.strengths.friendlyStaff")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }}></div>
                    <span className="text-muted-foreground">{t("charts.strengths.valueForMoney")}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Diagramme de Pareto */}
        {showParetoChart && <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {t("dashboard.paretoProblems")}
              </CardTitle>
              <p className="text-sm text-gray-600">{t("dashboard.paretoProblemsDescription")}</p>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {(() => {
                  // Mapping couleurs par catégorie: Rouge (critique), Orange (important), Jaune (secondaire)
                  const getCategoryColor = (name: string): string => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('service') || lowerName.includes('attente') || lowerName.includes('lent')) {
                      return 'hsl(0, 84%, 60%)'; // Rouge
                    }
                    if (lowerName.includes('qualité') || lowerName.includes('plat') || lowerName.includes('qualite')) {
                      return 'hsl(25, 95%, 53%)'; // Orange
                    }
                    if (lowerName.includes('prix') || lowerName.includes('cher')) {
                      return 'hsl(45, 93%, 47%)'; // Jaune
                    }
                    return 'hsl(0, 84%, 60%)'; // Fallback rouge
                  };
                  
                  return (
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
                          if (name === 'Cumulative') return [`${value}%`, t("dashboard.cumulativePercent")];
                          return [value, t("dashboard.occurrences")];
                        }} />
                        <Bar yAxisId="left" dataKey="count" name={t("dashboard.occurrences")}>
                          {paretoData.map((entry: any, index: number) => (
                            <Cell key={`pareto-cell-${index}`} fill={getCategoryColor(entry.name)} />
                          ))}
                        </Bar>
                        <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="hsl(var(--primary))" strokeWidth={2} dot={{
                          fill: "hsl(var(--primary))",
                          strokeWidth: 2,
                          r: 4
                        }} name="Cumulative" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
              <p className="text-sm text-gray-500 mt-1 mb-0 leading-tight">{t("dashboard.barRepresentsProblems")}</p>
              
              {/* Camembert + Barres - Répartition des problèmes */}
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700 mb-3 mt-0">{t("dashboard.problemsDistribution")}</h4>
                {(() => {
                  const pieData = paretoData.map((item: any) => ({
                    name: item.name,
                    value: item.count
                  }));
                  const total = pieData.reduce((sum: number, item: any) => sum + item.value, 0);
                  
                  // Helper pour espaces insécables (empêche les retours à la ligne)
                  const nbsp = (s: string) => s.split(" ").join("\u00A0");
                  
                  // Mapping couleurs par catégorie: Rouge (critique), Orange (important), Jaune (secondaire)
                  const getCategoryColor = (name: string): string => {
                    const lowerName = name.toLowerCase();
                    if (lowerName.includes('service') || lowerName.includes('attente')) {
                      return 'hsl(0, 84%, 60%)'; // Rouge
                    }
                    if (lowerName.includes('qualité') || lowerName.includes('plat')) {
                      return 'hsl(25, 95%, 53%)'; // Orange
                    }
                    if (lowerName.includes('prix')) {
                      return 'hsl(45, 93%, 47%)'; // Jaune
                    }
                    // Fallback pour autres catégories
                    return 'hsl(0, 84%, 60%)';
                  };
                  
                  if (total === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-4">
                        {t("dashboard.noDataForCharts")}
                      </p>
                    );
                  }
                  
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Camembert */}
                      <div>
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              labelLine={{
                                stroke: 'currentColor',
                                strokeWidth: 1
                              }}
                              outerRadius={95}
                              fill="#8884d8"
                              dataKey="value"
                              label={({ cx, cy, midAngle, outerRadius, name, percent }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 30;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                const labelText = `${nbsp(name)}\u00A0(${(percent * 100).toFixed(0)}%)`;
                                const color = getCategoryColor(name);
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    fill={color}
                                    textAnchor={x > cx ? 'start' : 'end'}
                                    dominantBaseline="central"
                                    fontSize={10}
                                    fontWeight={500}
                                    style={{ whiteSpace: 'nowrap' }}
                                  >
                                    {labelText}
                                  </text>
                                );
                              }}
                            >
                              {pieData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number, name: string) => {
                                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return [`${value} occurrences (${pct}%)`, name];
                              }}
                            />
                            
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Diagramme en barres verticales */}
                      <div>
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={pieData} margin={{ top: 20, right: 20, left: 0, bottom: 40 }}>
                            <XAxis 
                              dataKey="name" 
                              interval={0}
                              height={50}
                              tick={(props: any) => {
                                const { x, y, payload } = props;
                                const value = nbsp(String(payload?.value ?? ""));
                                return (
                                  <text
                                    x={x}
                                    y={y}
                                    dy={16}
                                    textAnchor="middle"
                                    fill="#6b7280"
                                    fontSize={9}
                                    style={{ pointerEvents: "none" }}
                                  >
                                    {value}
                                  </text>
                                );
                              }}
                            />
                            <YAxis hide />
                            <Tooltip 
                              cursor={false}
                              formatter={(value: number, name: string) => {
                                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return [`${value} ${t("dashboard.occurrences")} (${pct}%)`, t("dashboard.occurrences")];
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 11, fill: 'hsl(var(--foreground))' }}>
                              {pieData.map((entry: any, index: number) => (
                                <Cell key={`bar-${index}`} fill={getCategoryColor(entry.name)} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })()}
                
                {/* Légende globale sous les graphiques */}
                <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(0, 84%, 60%)' }}></div>
                    <span className="text-muted-foreground">Service / attente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(25, 95%, 53%)' }}></div>
                    <span className="text-muted-foreground">Qualité des plats</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }}></div>
                    <span className="text-muted-foreground">Prix</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Recommandations */}
        <Card className="relative mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-blue-500" />
                <CardTitle className="text-lg">Recommandations actionnables</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowRecommandations(!showRecommandations)} className="h-6 w-6 p-0 hover:bg-blue-50">
                {showRecommandations ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">Actions concrètes à mettre en place</p>
          </CardHeader>
          {showRecommandations && <CardContent>
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
                  <p className="text-sm">{t("dashboard.noRecommendationsAvailable")}</p>
                  <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToGetRecommendations")}</p>
                </div>
              )}
            </div>
          </CardContent>}
        </Card>

        {/* Checklist opérationnelle */}
        <Card className="relative mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-emerald-600" />
                <CardTitle className="text-lg">{t("dashboard.operationalChecklist")}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowChecklist(!showChecklist)} className="h-6 w-6 p-0 hover:bg-emerald-50">
                {showChecklist ? <ChevronUp className="w-3 h-3 text-emerald-600" /> : <ChevronDown className="w-3 h-3 text-emerald-600" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">{t("dashboard.concreteActions")}</p>
          </CardHeader>
          {showChecklist && <CardContent>
            <div className="space-y-8">
              {/* Section 1 - Checklist opérationnelle */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">{t("dashboard.operationalChecklist")}</h4>
                <div className="space-y-3">
                  {/* Action prioritaire */}
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-red-500 text-white text-xs">{t("dashboard.priorityAction")}</Badge>
                    </div>
                    <p className="text-sm text-gray-700">
                      {topIssues.length > 0 
                        ? t("dashboard.fixMainFrictionPoint", { issue: topIssues[0]?.theme || topIssues[0]?.issue || t("dashboard.notIdentified") })
                        : t("dashboard.analyzeReviewsToIdentifyFrictionPoints")}
                    </p>
                  </div>
                  
                  {/* Court terme */}
                  <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-yellow-500 text-white text-xs">{t("dashboard.shortTerm")}</Badge>
                    </div>
                    <ul className="space-y-2">
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        {t("dashboard.trainTeamOnIdentifiedImprovements")}
                      </li>
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        {topStrengths.length > 0 
                          ? t("dashboard.enhanceStrengths", { strength: topStrengths[0]?.theme || topStrengths[0]?.strength || t("dashboard.notIdentified") })
                          : t("dashboard.identifyAndEnhanceExistingStrengths")}
                      </li>
                    </ul>
                  </div>
                  
                  {/* Gestion des avis */}
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-500 text-white text-xs">{t("dashboard.reviewManagement")}</Badge>
                    </div>
                    <ul className="space-y-2">
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        {t("dashboard.respondSystematically")}
                      </li>
                      <li className="text-sm text-gray-700 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        {t("dashboard.setUpRegularTracking")}
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Séparateur visuel */}
              <div className="border-t border-gray-200"></div>

              {/* Section 2 - Priorisation des actions */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-4">{t("dashboard.actionPrioritization")}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">{t("dashboard.action")}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">{t("dashboard.impact")}</th>
                        <th className="text-center py-3 px-4 font-semibold text-gray-700">{t("dashboard.effort")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">{t("dashboard.fixMainFrictionPointIdentified")}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-red-100 text-red-700 border-red-200">{t("dashboard.high")}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t("dashboard.medium")}</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">{t("dashboard.trainTeamOnIdentifiedImprovements")}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t("dashboard.medium")}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-700 border-green-200">Faible</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">Répondre systématiquement aux avis clients</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Moyen</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-700 border-green-200">Faible</Badge>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-4 text-gray-700">{t("dashboard.enhanceStrengths", { strength: "" })}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{t("dashboard.medium")}</Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge className="bg-green-100 text-green-700 border-green-200">{t("dashboard.low")}</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-4 italic">
                  {t("dashboard.recommendedStartHighImpactLowEffort")}
                </p>
              </div>
            </div>
          </CardContent>}
        </Card>

        {/* Analyse par thématiques */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-600" />
                <span className="text-2xl font-bold text-purple-600">78%</span>
                <CardTitle className="text-lg">{t("dashboard.themesAnalysis")}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowThematiques(!showThematiques)} className="h-6 w-6 p-0 hover:bg-purple-50">
                {showThematiques ? <ChevronUp className="w-3 h-3 text-purple-600" /> : <ChevronDown className="w-3 h-3 text-purple-600" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">{t("dashboard.reviewsDistributionByCategories")}</p>
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
                            title={t("dashboard.positive")}
                            className="inline-flex items-center justify-center min-w-[48px] h-9 px-3 rounded-xl text-sm font-semibold shadow-sm bg-green-50 text-green-600"
                          >
                            {p}%
                          </span>
                          <span
                            title={t("dashboard.negative")}
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
                            <div className="text-sm text-gray-500">{t("dashboard.percentageOfReviews", { percentage: theme.percentage })}</div>
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
                    <p className="text-sm">{t("dashboard.noThemesIdentified")}</p>
                    <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeeThemes")}</p>
                  </div>
                )}
              </div>
            </CardContent>}
        </Card>

        {/* Analyse détaillée */}
        <Card className="relative mt-10 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <span className="text-2xl font-bold text-indigo-600">{totalReviews}</span>
                <CardTitle className="text-lg">{t("dashboard.reviewsDecryption")}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAnalyseDetaillee(!showAnalyseDetaillee)} className="h-6 w-6 p-0 hover:bg-indigo-50">
                {showAnalyseDetaillee ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">{t("dashboard.completeDetailsRatingsThemes")}</p>
          </CardHeader>
          {showAnalyseDetaillee && <CardContent>
            <div className="space-y-6">
              {/* Répartition des avis par note */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">{t("dashboard.reviewsDistributionByRating")}</h4>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const count = allReviewsForChart.filter(r => r.rating === rating).length;
                    const percentage = allReviewsForChart.length > 0 ? (count / allReviewsForChart.length) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="w-16 text-sm font-medium text-gray-600">{rating} {rating === 1 ? t("dashboard.star") : t("dashboard.stars")}</span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${rating >= 4 ? 'bg-green-500' : rating === 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="w-16 text-sm text-gray-600 text-right">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Thématiques récurrentes */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">{t("dashboard.recurringThemes")}</h4>
                {insight?.themes && insight.themes.length > 0 ? (
                  <div className="space-y-2">
                    {insight.themes.map((theme: any, index: number) => {
                      const themeCount = theme.count || 0;
                      const percentage = totalAnalyzed > 0 ? (themeCount / totalAnalyzed) * 100 : 0;
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <span className="font-medium text-gray-700">{theme.theme}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{themeCount} {themeCount === 1 ? t("dashboard.mention") : t("dashboard.mentions")}</span>
                            <Badge variant="outline" className="text-indigo-600 border-indigo-600">{percentage.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">{t("dashboard.noThemesIdentified")}</p>
                    <p className="text-xs mt-1">{t("dashboard.analyzeEstablishmentToSeeThemes")}</p>
                  </div>
                )}
              </div>

              {/* Indicateurs clés */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">{t("dashboard.keyIndicators")}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{avgRating.toFixed(1)}</p>
                    <p className="text-xs text-gray-600">{t("dashboard.averageRating")}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{positivePct}%</p>
                    <p className="text-xs text-gray-600">{t("dashboard.positiveReviews")}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{negativePct}%</p>
                    <p className="text-xs text-gray-600">{t("dashboard.negativeReviews")}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-indigo-600">{totalReviews}</p>
                    <p className="text-xs text-gray-600">{t("dashboard.totalReviews")}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>}
        </Card>

        {/* Réponse automatique */}
        <Card className="relative">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-purple-600">
                  <Info className="w-6 h-6" />
                </span>
                <CardTitle className="text-lg">{t("dashboard.autoResponse")}</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowReponseAuto(!showReponseAuto)} className="h-6 w-6 p-0 hover:bg-purple-50">
                {showReponseAuto ? <ChevronUp className="w-3 h-3 text-purple-600" /> : <ChevronDown className="w-3 h-3 text-purple-600" />}
              </Button>
            </div>
            <p className="text-sm text-gray-500">{t("dashboard.automatedSystemForReviews")}</p>
          </CardHeader>
          {showReponseAuto && <CardContent>
              <div className="space-y-4">
                {/* Mode file d'attente : afficher un seul avis à la fois */}
                {pendingReviews.length > 0 ? (
                  (() => {
                    // Avis actuellement affiché basé sur currentReviewIndex
                    const review = pendingReviews[currentReviewIndex];
                    if (!review) return null;
                    
                    const rating = review.rating || 0;
                    const isPositive = rating >= 4;
                    const authorName = review.author || t("dashboard.anonymous");
                    const reviewText = extractOriginalText(review.text) || t("dashboard.noComment");
                    const reviewId = review.id || `review-${currentReviewIndex}`;
                    
                    // Fonction pour générer une réponse IA personnalisée
                    const generateAiResponse = async (reviewId: string) => {
                      setIsGeneratingResponse(prev => ({ ...prev, [reviewId]: true }));
                      
                      try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session?.access_token) {
                          toast.error(t("auth.sessionExpired"), {
                            description: t("auth.pleaseReconnect"),
                          });
                          return;
                        }

                        const response = await fetch(
                          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-review-response`,
                          {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({
                              review: {
                                text: extractOriginalText(review.text) || review.text,
                                rating: review.rating,
                                author: review.author || review.author_name,
                                published_at: review.published_at,
                                language: review.language || review.language_code,
                              },
                              establishment: {
                                name: selectedEtab?.name || selectedEstablishment?.name || 'votre établissement',
                                formatted_address: selectedEtab?.address || selectedEstablishment?.formatted_address || '',
                                category: 'restaurant',
                                city: '',
                              },
                            }),
                          }
                        );

                        const data = await response.json();

                        if (!response.ok) {
                          if (response.status === 429) {
                            toast.error(t("dashboard.tooManyRequests"), {
                              description: t("dashboard.waitBeforeRetry"),
                            });
                          } else if (response.status === 402) {
                            toast.error(t("dashboard.insufficientCredits"), {
                              description: t("dashboard.reloadAICredits"),
                            });
                          } else {
                            toast.error(t("common.error"), {
                              description: data.error || t("dashboard.cannotGenerateResponse"),
                            });
                          }
                          return;
                        }

                        if (data.response) {
                          setAiGeneratedResponses(prev => ({ ...prev, [reviewId]: data.response }));
                          setEditedResponses(prev => ({ ...prev, [reviewId]: data.response }));
                          toast.success(t("dashboard.responseGenerated"), {
                            description: t("dashboard.canModifyBeforeValidate"),
                          });
                        }
                      } catch (error) {
                        console.error('Erreur génération réponse IA:', error);
                        toast.error(t("common.error"), {
                          description: t("dashboard.generationError"),
                        });
                      } finally {
                        setIsGeneratingResponse(prev => ({ ...prev, [reviewId]: false }));
                      }
                    };
                    
                    // Réponse par défaut simple (utilisée uniquement si aucune réponse IA n'a été générée)
                    const defaultResponse = isPositive
                      ? t("dashboard.defaultPositiveResponse", { name: authorName.split(' ')[0] })
                      : t("dashboard.defaultNegativeResponse", { name: authorName.split(' ')[0] });
                    
                    const currentResponse = editedResponses[reviewId] || aiGeneratedResponses[reviewId] || defaultResponse;
                    const isEditing = editingReviewId === reviewId;
                    const hasAiResponse = !!aiGeneratedResponses[reviewId];
                    const isGenerating = isGeneratingResponse[reviewId];
                    
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
                            {t("dashboard.toValidate")}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">"{reviewText.substring(0, 150)}{reviewText.length > 150 ? '...' : ''}"</p>
                        <div className="bg-white border-l-4 border-purple-500 p-3 rounded">
                          <p className="text-sm text-gray-600 font-medium mb-1">{t("dashboard.proposedAutomaticResponse")}:</p>
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
                                  {t("common.save")}
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
                                  {t("common.cancel")}
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                                  disabled={isGenerating}
                                  onClick={() => generateAiResponse(reviewId)}
                                >
                                  {isGenerating ? (
                                    <>
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                      {t("dashboard.generating")}
                                    </>
                                  ) : hasAiResponse ? (
                                    <>
                                      <Lightbulb className="w-3 h-3 mr-1" />
                                      {t("dashboard.regenerateWithAI")}
                                    </>
                                  ) : (
                                    <>
                                      <Lightbulb className="w-3 h-3 mr-1" />
                                      {t("dashboard.generateWithAI")}
                                    </>
                                  )}
                                </Button>
                                 <Button 
                                  size="sm" 
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                  disabled={isValidatingReview[reviewId]}
                                  onClick={async () => {
                                    try {
                                      if (!user?.id || !selectedEtab?.place_id) {
                                        toast.error(t("common.error"), {
                                          description: t("dashboard.userOrEstablishmentNotDefined"),
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
                                      
                                      // Marquer comme validée localement
                                      setValidatedReviews(prev => new Set([...prev, reviewId]));
                                      
                                      // Afficher le toast de succès
                                      toast.success(t("dashboard.responseValidatedAndSaved"), {
                                        description: t("dashboard.responseSavedSuccess"),
                                        duration: 3000
                                      });
                                      
                                      // Déclencher l'événement pour mettre à jour le compteur
                                      window.dispatchEvent(new CustomEvent('response-validated', {
                                        detail: { placeId: selectedEtab.place_id }
                                      }));
                                      
                                      // LOGIQUE FILE D'ATTENTE : passer au prochain avis
                                      // Retirer l'avis validé de la liste
                                      setPendingReviews(prev => prev.filter(r => r.id !== reviewId));
                                      
                                      // Si on a retiré l'avis et qu'il reste d'autres avis, on garde le même index
                                      // (l'avis suivant prendra la place de celui qu'on vient de retirer)
                                      // Sinon, réinitialiser l'index à 0
                                      if (pendingReviews.length - 1 === 0) {
                                        setCurrentReviewIndex(0);
                                      } else if (currentReviewIndex >= pendingReviews.length - 1) {
                                        // Si on était sur le dernier, revenir au premier
                                        setCurrentReviewIndex(0);
                                      }
                                      // Sinon, on garde currentReviewIndex inchangé car le suivant prend la place
                                      
                                    } catch (error: any) {
                                      console.error('validateReponse', error);
                                      toast.error(t("dashboard.saveFailed"), {
                                        description: error.message || t("common.error"),
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
                                      {t("dashboard.validating")}
                                    </>
                                  ) : (
                                    t("dashboard.validate")
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
                                  {t("common.edit")}
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
                              toast.success(t("common.copied"), {
                                description: t("dashboard.responseCopiedToClipboard"),
                              });
                            }}
                            title={t("dashboard.copyResponse")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {hasAiResponse && (
                          <div className="mt-3 text-green-600 text-sm flex items-center gap-1">
                            ✅ {t("dashboard.responseGenerated")} — {t("dashboard.canModifyBeforeValidate")}
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p className="text-lg font-medium text-gray-900">🎉 {t("dashboard.allResponsesProcessed")}</p>
                    <p className="text-sm mt-1">{t("dashboard.noPendingReviews")}</p>
                  </div>
                )}
              </div>
            </CardContent>}
        </Card>
      </div>
    </div>;
};
export default Dashboard;