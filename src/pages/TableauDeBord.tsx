import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BarChart3, Clock, TrendingUp, User, LogOut, Home, Building, Target, Bell, MessageCircle, Star, ArrowUp, CheckCircle, ArrowDownRight, Minus, Award, Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import { fr, enUS, it, es, ptBR } from "date-fns/locale";
import { getBaselineScore, formatDelta, getEvolutionStatus, computeSatisfactionPct, ensureBaselineSatisfaction, computeSatisfactionDelta } from "@/utils/baselineScore";
import { useCurrentEstablishment } from "@/hooks/useCurrentEstablishment";
import { getReponsesStats } from "@/lib/reponses";
import { SubscriptionCard } from "@/components/SubscriptionCard";
import { useTranslation } from "react-i18next";
import { DashboardTabs } from "@/components/DashboardTabs";
import { capitalizeName } from "@/utils/capitalizeName";
import { extractOriginalText } from "@/utils/extractOriginalText";


const Dashboard = () => {
  const [userProfile, setUserProfile] = useState<{ first_name: string; last_name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentReviewsCount, setRecentReviewsCount] = useState(0);
  const [lastReviewDate, setLastReviewDate] = useState<Date | null>(null);
  const [validatedResponsesCount, setValidatedResponsesCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalReviewsForEstablishment, setTotalReviewsForEstablishment] = useState(0);
  const [allReviews, setAllReviews] = useState<any[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { establishment: currentEstablishment, loading: establishmentLoading } = useCurrentEstablishment();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('apercu');
  

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

        // Pour l'instant, utiliser les données de base de l'utilisateur
        const profile = {
          first_name: session.user.user_metadata?.first_name || t("common.user"),
          last_name: session.user.user_metadata?.last_name || ''
        };

        setUserProfile(profile);

        // Si aucun établissement n'est sélectionné, réinitialiser les données
        if (!currentEstablishment?.place_id) {
          setRecentReviewsCount(0);
          setAllReviews([]);
          setLastReviewDate(null);
          setAvgRating(0);
          setValidatedResponsesCount(0);
          setTotalReviewsForEstablishment(0);
          setLoading(false);
          return;
        }

        // Récupérer les avis UNIQUEMENT pour l'établissement actif
        const { data: reviews, error } = await supabase
          .from('reviews')
          .select('published_at, inserted_at, rating, text, place_id')
          .eq('user_id', session.user.id)
          .eq('place_id', currentEstablishment.place_id) // ← Filtrer par place_id de l'établissement actif
          .order('published_at', { ascending: false });

        if (!error && reviews) {
          setRecentReviewsCount(reviews.length);
          setAllReviews(reviews);
          
          const lastDateStr = reviews.length > 0 ? (reviews[0].published_at || reviews[0].inserted_at) : null;
          if (lastDateStr) {
            setLastReviewDate(new Date(lastDateStr));
          } else {
            setLastReviewDate(null);
          }
          
          // Calculer la moyenne des notes pour CET établissement
          const ratingsWithValue = reviews.filter(r => r.rating !== null && r.rating !== undefined);
          if (ratingsWithValue.length > 0) {
            const sum = ratingsWithValue.reduce((acc, r) => acc + (r.rating || 0), 0);
            const average = sum / ratingsWithValue.length;
            setAvgRating(average);
          } else {
            setAvgRating(0);
          }

          // Utiliser getReponsesStats pour les réponses validées
          if (currentEstablishment.place_id && session.user.id) {
            const stats = await getReponsesStats(currentEstablishment.place_id, session.user.id);
            setValidatedResponsesCount(stats.validated);
            setTotalReviewsForEstablishment(stats.total);
          }
        } else if (error) {
          console.error('Error fetching reviews:', error);
          setRecentReviewsCount(0);
          setAllReviews([]);
          setAvgRating(0);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserProfile();

    // Écouter les validations de réponses
    const handleResponseValidated = async () => {
      if (!currentEstablishment?.place_id) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Utiliser getReponsesStats pour mettre à jour
      const stats = await getReponsesStats(currentEstablishment.place_id, session.user.id);
      setValidatedResponsesCount(stats.validated);
      setTotalReviewsForEstablishment(stats.total);
    };

    window.addEventListener('response-validated', handleResponseValidated);

    // S'abonner aux changements en temps réel UNIQUEMENT pour l'établissement actif
    let channel: ReturnType<typeof supabase.channel> | null = null;
    if (currentEstablishment?.place_id) {
      channel = supabase
        .channel(`reviews-changes-${currentEstablishment.place_id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'reviews',
            filter: `place_id=eq.${currentEstablishment.place_id}` // ← Filtrer par place_id
          },
          (payload) => {
            // Vérifier que le nouvel avis appartient bien à l'établissement actif
            if (payload.new.place_id === currentEstablishment.place_id) {
              setRecentReviewsCount(prev => prev + 1);
              if (payload.new.inserted_at) {
                setLastReviewDate(new Date(payload.new.inserted_at));
              }
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('response-validated', handleResponseValidated);
    };
  }, [navigate, currentEstablishment?.place_id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // Calcul de l'évolution de la note depuis l'enregistrement (avant le return conditionnel)
  const ratingEvolution = useMemo(() => {
    if (!currentEstablishment?.place_id || avgRating === 0 || allReviews.length === 0) {
      return null;
    }
    
    const baseline = getBaselineScore(currentEstablishment.place_id, avgRating);
    const delta = avgRating - baseline.score;
    const status = getEvolutionStatus(delta);
    const formattedDelta = formatDelta(delta);
    
    return {
      delta,
      formattedDelta,
      status,
      baseline: baseline.score,
      baselineDate: baseline.date,
    };
  }, [currentEstablishment?.place_id, avgRating, allReviews.length]);

  // Calcul de l'évolution de la satisfaction depuis l'enregistrement
  const satisfactionEvolution = useMemo(() => {
    if (!currentEstablishment?.place_id || allReviews.length === 0) {
      return null;
    }
    
    const currentSatisfactionPct = computeSatisfactionPct(allReviews);
    const baseline = ensureBaselineSatisfaction(currentEstablishment.place_id, currentSatisfactionPct);
    const delta = computeSatisfactionDelta(currentSatisfactionPct, baseline.percentage);
    
    return {
      delta,
      currentPct: currentSatisfactionPct,
      baselinePct: baseline.percentage,
      baselineDate: baseline.date,
    };
  }, [currentEstablishment?.place_id, allReviews]);

  // Calcul des métriques pour les 4 cartes
  const metrics = useMemo(() => {
    if (allReviews.length === 0) {
      return {
        globalPerformance: { label: t("noData") || "—", color: "gray", icon: Award },
        satisfactionIndex: { percentage: 0 },
        perceivedValue: { label: t("noData") || "—", color: "gray" },
        deliveredExperience: { label: t("noData") || "—", color: "gray" }
      };
    }

    // 1. Performance globale basée sur la note moyenne
    let globalPerformanceLabel = t("dashboard.good");
    let globalPerformanceColor = "emerald";
    if (avgRating >= 4.5) {
      globalPerformanceLabel = t("dashboard.excellent") || "Excellent";
      globalPerformanceColor = "emerald";
    } else if (avgRating >= 4.0) {
      globalPerformanceLabel = t("dashboard.good");
      globalPerformanceColor = "emerald";
    } else if (avgRating >= 3.0) {
      globalPerformanceLabel = t("dashboard.average") || "Moyen";
      globalPerformanceColor = "amber";
    } else {
      globalPerformanceLabel = t("dashboard.toImprove") || "À améliorer";
      globalPerformanceColor = "red";
    }

    // 2. Indice de satisfaction : pourcentage d'avis positifs (4-5 étoiles)
    const positiveReviews = allReviews.filter(r => r.rating >= 4);
    const satisfactionPercentage = allReviews.length > 0 
      ? Math.round((positiveReviews.length / allReviews.length) * 100)
      : 0;

    // 3. Valeur ressentie : analyse des sentiments dans les commentaires
    const positiveKeywords = ['excellent', 'super', 'génial', 'parfait', 'délicieux', 'formidable', 'extraordinaire', 'magnifique', 'incroyable', 'merveilleux', 'très bon', 'top', 'impeccable', 'rapide', 'accueillant', 'sympa', 'je recommande'];
    const negativeKeywords = ['décevant', 'mauvais', 'lent', 'pas bon', 'froid', 'cher pour ce que', 'horrible', 'médiocre', 'nul', 'catastrophe', 'déçu', 'inadmissible'];
    
    let positiveSentimentCount = 0;
    let negativeSentimentCount = 0;
    
    allReviews.forEach(review => {
      const text = extractOriginalText(review.text || '').toLowerCase();
      if (text) {
        const hasPositive = positiveKeywords.some(kw => text.includes(kw));
        const hasNegative = negativeKeywords.some(kw => text.includes(kw));
        if (hasPositive) positiveSentimentCount++;
        if (hasNegative) negativeSentimentCount++;
      }
    });
    
    let perceivedValueLabel = t("dashboard.high");
    let perceivedValueColor = "amber";
    const sentimentRatio = positiveSentimentCount + negativeSentimentCount > 0
      ? positiveSentimentCount / (positiveSentimentCount + negativeSentimentCount)
      : 0.5;
    
    if (sentimentRatio >= 0.6) {
      perceivedValueLabel = t("dashboard.high");
      perceivedValueColor = "emerald";
    } else if (sentimentRatio >= 0.4) {
      perceivedValueLabel = t("dashboard.average") || "Moyenne";
      perceivedValueColor = "amber";
    } else {
      perceivedValueLabel = t("dashboard.low") || "Faible";
      perceivedValueColor = "red";
    }

    // 4. Expérience délivrée : basée sur les avis récents (10 derniers)
    const recentReviews = allReviews.slice(0, 10);
    const recentPositive = recentReviews.filter(r => r.rating >= 4).length;
    const recentNegative = recentReviews.filter(r => r.rating <= 2).length;
    const recentPositiveRatio = recentReviews.length > 0 ? recentPositive / recentReviews.length : 0;
    
    let deliveredExperienceLabel = t("dashboard.smooth");
    let deliveredExperienceColor = "violet";
    
    if (recentPositiveRatio >= 0.7) {
      deliveredExperienceLabel = t("dashboard.smooth");
      deliveredExperienceColor = "violet";
    } else if (recentPositiveRatio >= 0.4) {
      deliveredExperienceLabel = t("dashboard.variable") || "Variable";
      deliveredExperienceColor = "amber";
    } else {
      deliveredExperienceLabel = t("dashboard.toReview") || "À revoir";
      deliveredExperienceColor = "red";
    }

    return {
      globalPerformance: { 
        label: globalPerformanceLabel, 
        color: globalPerformanceColor, 
        icon: Award 
      },
      satisfactionIndex: { percentage: satisfactionPercentage },
      perceivedValue: { 
        label: perceivedValueLabel, 
        color: perceivedValueColor 
      },
      deliveredExperience: { 
        label: deliveredExperienceLabel, 
        color: deliveredExperienceColor 
      }
    };
  }, [allReviews, avgRating, t]);

  // État de chargement combiné : données utilisateur + établissement
  const isLoading = loading || establishmentLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">{t("common.loading")}</div>
      </div>
    );
  }

  const displayName = userProfile 
    ? capitalizeName(`${userProfile.first_name} ${userProfile.last_name}`)
    : t("dashboard.user");

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background with organic shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-purple-100">
        <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-40"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-gradient-to-bl from-blue-300 to-cyan-300 rounded-full blur-2xl opacity-25"></div>
      </div>

      <div className="relative z-10">
        {/* Main content */}
        <div className="container mx-auto px-4 pt-8 pb-10">
          {/* Welcome card */}
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-6">
            <CardContent className="p-8 text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">{t("dashboard.welcomeWithName", { name: displayName })}</h2>
              {!isLoading && currentEstablishment?.name ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                    <Building className="w-5 h-5" />
                    <span>{currentEstablishment.name}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link to="/etablissement">
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium">
                        <Building className="w-5 h-5 mr-2" />
                        {t("nav.establishment")}
                      </Button>
                    </Link>
                    <Link to="/dashboard">
                      <Button variant="outline" className="border-gray-300 text-gray-700 px-8 py-3 rounded-full font-medium">
                        <BarChart3 className="w-5 h-5 mr-2" />
                        {t("dashboard.viewDashboard")}
                      </Button>
                    </Link>
                  </div>
                </>
              ) : !isLoading && !currentEstablishment ? (
                <div className="flex flex-col items-center gap-4 pt-4">
                  <Link to="/etablissement">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-medium">
                      <Plus className="w-5 h-5 mr-2" />
                      Ajouter un établissement
                    </Button>
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>

            {/* Notifications section */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden max-w-5xl mx-auto mb-4">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-gray-900">{t("dashboard.notifications")}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border-2 border-blue-300 shadow-md">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {recentReviewsCount} {t("dashboard.reviews")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {lastReviewDate 
                            ? t("dashboard.reviewsReceived", { 
                                time: formatDistanceToNow(lastReviewDate, { 
                                  addSuffix: true, 
                                  locale: i18n.language === 'fr' ? fr : 
                                         i18n.language === 'en' ? enUS :
                                         i18n.language === 'it' ? it :
                                         i18n.language === 'es' ? es :
                                         i18n.language === 'pt' ? ptBR : enUS
                                }) 
                              })
                            : t("dashboard.noReviewsYet")
                          }
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center border-2 border-green-300 shadow-md">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {avgRating > 0 ? `${avgRating.toFixed(1)}/5` : t("dashboard.rating")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {avgRating > 0 ? t("dashboard.averageRating") : t("dashboard.waitingForData")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-md">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {validatedResponsesCount}/{totalReviewsForEstablishment} {t("dashboard.responses")} {t("dashboard.validated")}
                        </p>
                        <p className="text-sm text-gray-600">{t("dashboard.responses")}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center border-2 border-purple-300 shadow-md">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {allReviews.length > 0 
                            ? `${Math.round(computeSatisfactionPct(allReviews))}%`
                            : t("dashboard.satisfaction")
                          }
                        </p>
                        <p className="text-sm text-gray-600">
                          {allReviews.length > 0 ? t("dashboard.satisfactionIndex") : t("dashboard.waitingForReviews")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto pt-6 pb-0">
            {/* Performance globale */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t("dashboard.globalPerformance")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className={`inline-flex items-center gap-2 rounded-full px-5 py-3 shadow-md ${
                    metrics.globalPerformance.color === 'gray' ? 'bg-gray-400' :
                    metrics.globalPerformance.color === 'emerald' ? 'bg-emerald-500' :
                    metrics.globalPerformance.color === 'amber' ? 'bg-amber-500' :
                    metrics.globalPerformance.color === 'red' ? 'bg-red-500' : 'bg-emerald-500'
                  }`}>
                    <Award className="w-5 h-5 text-white" />
                    {avgRating >= 4.5 && <span className="text-amber-300 text-lg">★</span>}
                    <span className="text-white font-semibold text-base">{metrics.globalPerformance.label}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.basedOnRating")}
                </p>
              </CardContent>
            </Card>

            {/* Indice de satisfaction */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t("dashboard.satisfactionIndex")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-blue-500 rounded-full px-5 py-3 shadow-md">
                    <Star className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-base">
                      {allReviews.length > 0 ? `${metrics.satisfactionIndex.percentage}%` : '0%'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.identifyProblems")}
                </p>
              </CardContent>
            </Card>

            {/* Valeur ressentie */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t("dashboard.perceivedValue")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className={`inline-flex items-center gap-2 rounded-full px-5 py-3 shadow-md ${
                    metrics.perceivedValue.color === 'gray' ? 'bg-gray-400' :
                    metrics.perceivedValue.color === 'emerald' ? 'bg-emerald-500' :
                    metrics.perceivedValue.color === 'amber' ? 'bg-amber-500' :
                    metrics.perceivedValue.color === 'red' ? 'bg-red-500' : 'bg-amber-500'
                  }`}>
                    <TrendingUp className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-base">{metrics.perceivedValue.label}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.calculateScore")}
                </p>
              </CardContent>
            </Card>

            {/* Expérience délivrée */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{t("dashboard.deliveredExperience")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className={`inline-flex items-center gap-2 rounded-full px-5 py-3 shadow-md ${
                    metrics.deliveredExperience.color === 'gray' ? 'bg-gray-400' :
                    metrics.deliveredExperience.color === 'violet' ? 'bg-violet-500' :
                    metrics.deliveredExperience.color === 'amber' ? 'bg-amber-500' :
                    metrics.deliveredExperience.color === 'red' ? 'bg-red-500' : 'bg-violet-500'
                  }`}>
                    <Clock className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-base">{metrics.deliveredExperience.label}</span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed">
                  {t("dashboard.summaryRecommendations")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;