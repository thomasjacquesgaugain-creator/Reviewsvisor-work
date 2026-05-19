import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BarChart3, Clock, TrendingUp, User, LogOut, Home, Building, Target, Bell, MessageCircle, Star, ArrowUp, CheckCircle, ArrowDownRight, Minus, Award, Plus, Loader2 } from "lucide-react";
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
import { extractOriginalText } from "@/utils/extractOriginalText";
import { getEstablishmentTypeTranslationKey } from "@/utils/establishmentTypeMapping";
import { AppPageBackground } from "@/components/AppPageBackground";
import { useAuth } from "@/contexts/AuthProvider";


const Dashboard = () => {
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
  const { displayName: authDisplayName } = useAuth();
  const [activeTab, setActiveTab] = useState('apercu');

  const currentEstablishmentTypes = useMemo(() => {
    const types = currentEstablishment?.types;
    if (!types) return null;

    const translateType = (value: string) => {
      const trimmedValue = String(value).trim();
      if (!trimmedValue) return null;

      const translationKey = getEstablishmentTypeTranslationKey(trimmedValue);
      if (!translationKey) return trimmedValue;

      return t(
        `settings.establishmentInformation.establishmentTypesOptions.${translationKey}`,
        { defaultValue: trimmedValue }
      );
    };

    if (Array.isArray(types)) {
      return types
        .map((type) => translateType(String(type)))
        .filter(Boolean)
        .join(", ");
    }

    return translateType(String(types));
  }, [currentEstablishment?.types, t]);

  useEffect(() => {
    const getUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate('/auth');
          return;
        }

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
        globalPerformance: { label: t("common.noData") || "—", color: "gray", icon: Award },
        satisfactionIndex: { percentage: 0 },
        perceivedValue: { label: t("common.noData") || "—", color: "gray" },
        deliveredExperience: { label: t("common.noData") || "—", color: "gray" }
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
      <div className="app-page-shell">
        <AppPageBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-sm text-white dark:text-slate-400 px-3 py-2 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> 
            {t("common.loading")}
          </div>
        </div>
      </div>
    );
  }

  const displayName = authDisplayName || t("dashboard.user");

  return (
    <div className="app-page-shell">
      <AppPageBackground />

      <div className="relative z-10">
        {/* Main content */}
        <div className="container mx-auto px-4 pt-8 pb-10">
          {/* Welcome card */}
          <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl overflow-hidden max-w-3xl mx-auto mb-6">
            <CardContent className="p-8 text-center space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t("dashboard.welcomeWithName", { name: displayName })}</h2>
              {!isLoading && currentEstablishment?.name ? (
                <>
                  <div className="flex items-center justify-center gap-2 text-center text-primary font-semibold max-w-2xl mx-auto">
                    <Building className="w-5 h-5 flex-shrink-0" />
                    <span className="break-words leading-snug">
                      {currentEstablishment.name}
                      {currentEstablishmentTypes ? (
                        <span className="ml-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                          • (<span className="italic">{currentEstablishmentTypes}</span>)
                        </span>
                      ) : null}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                    <Link to="/etablissement">
                      <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-white px-8 py-3 rounded-full font-medium">
                        <Building className="w-5 h-5 mr-2" />
                        {t("nav.establishment")}
                      </Button>
                    </Link>
                    <Link to="/dashboard">
                      <Button
                        variant="outline"
                        className="h-10 rounded-full border-gray-300 bg-background px-8 py-3 font-medium text-gray-700 hover:bg-accent hover:text-accent-foreground dark:border-slate-700 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]"
                      >
                        <BarChart3 className="w-5 h-5 mr-2" />
                        {t("dashboard.viewDashboard")}
                      </Button>
                    </Link>
                  </div>
                </>
              ) : !isLoading && !currentEstablishment ? (
                <div className="flex flex-col items-center gap-4 pt-4">
                  <Link to="/etablissement">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground text-white px-8 py-3 rounded-full font-medium">
                      <Plus className="w-5 h-5 mr-2" />
                      {t("dashboard.addEstablishment")}
                    </Button>
                  </Link>
                </div>
              ) : null}
            </CardContent>
          </Card>

            {/* Notifications section */}
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl rounded-3xl overflow-hidden max-w-5xl mx-auto mb-4">
              <CardContent className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Bell className="w-5 h-5 text-primary" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t("dashboard.notifications")}</h3>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-slate-900 border border-blue-100 dark:border-blue-900/40 rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center border-2 border-blue-300 shadow-md">
                        <MessageCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {recentReviewsCount} {t("dashboard.reviews")}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
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

                  <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/40 dark:to-slate-900 border-green-200 dark:border-green-900/50 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center border-2 border-green-300 shadow-md">
                        <Star className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {avgRating > 0 ? `${avgRating.toFixed(1)}/5` : t("dashboard.rating")}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {avgRating > 0 ? t("dashboard.averageRating") : t("dashboard.waitingForData")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/40 dark:to-slate-900 border-yellow-200 dark:border-yellow-900/50 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-600 rounded-full flex items-center justify-center border-2 border-yellow-300 shadow-md">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {validatedResponsesCount}/{totalReviewsForEstablishment} {t("dashboard.responses")} {t("dashboard.validated")}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{t("dashboard.responses")}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-slate-900 border-purple-200 dark:border-purple-900/50 border rounded-xl">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center border-2 border-purple-300 shadow-md">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {allReviews.length > 0 
                            ? `${Math.round(computeSatisfactionPct(allReviews))}%`
                            : t("dashboard.satisfaction")
                          }
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
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
            <Card className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-black/30 rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/40 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t("dashboard.globalPerformance")}</h3>
                
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
                
                <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                  {t("dashboard.basedOnRating")}
                </p>
              </CardContent>
            </Card>

            {/* Indice de satisfaction */}
            <Card className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-black/30 rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-primary/15 dark:bg-primary/20 rounded-xl flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t("dashboard.satisfactionIndex")}</h3>
                
                {/* Badge central */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-blue-500 rounded-full px-5 py-3 shadow-md">
                    <Star className="w-5 h-5 text-white" />
                    <span className="text-white font-semibold text-base">
                      {allReviews.length > 0 ? `${metrics.satisfactionIndex.percentage}%` : '0%'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                  {t("dashboard.identifyProblems")}
                </p>
              </CardContent>
            </Card>

            {/* Valeur ressentie */}
            <Card className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-black/30 rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950/40 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t("dashboard.perceivedValue")}</h3>
                
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
                
                <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
                  {t("dashboard.calculateScore")}
                </p>
              </CardContent>
            </Card>

            {/* Expérience délivrée */}
            <Card className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-lg dark:shadow-black/30 rounded-2xl p-6">
              <CardContent className="p-0 space-y-4">
                <div className="w-12 h-12 bg-violet-100 dark:bg-violet-950/40 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-slate-100">{t("dashboard.deliveredExperience")}</h3>
                
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
                
                <p className="text-gray-600 dark:text-slate-400 text-sm leading-relaxed">
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
