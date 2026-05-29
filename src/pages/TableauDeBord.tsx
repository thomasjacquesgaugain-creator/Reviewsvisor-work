import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, BarChart3, Clock, TrendingUp, User, LogOut, Home, Building, Target, Bell, MessageCircle, Star, ArrowUp, CheckCircle, ArrowDownRight, Minus, Award, Plus, Loader2, Info, Smile, HeartHandshake, ClipboardCheck } from "lucide-react";
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
import { MetricInfoPopover } from "@/components/ui/MetricInfoPopover";
import { PerformanceIcon } from "@/components/ui/icons/PerformanceIcon";
import { SatisfactionGauge } from "@/components/ui/icons/SatisfactionGauge";
import { subMonths, parseISO } from "date-fns";

type MetricInfoLine = {
  title: string;
  description: string;
  weight?: string;
};

type ThresholdPill = {
  label: string;
  icon: string;
  bg: string;
  fg: string;
};

function MetricInfoContent({
  heading,
  lines,
  thresholds,
  thresholdsLabel,
  note,
  footer,
}: {
  heading: string;
  lines: MetricInfoLine[];
  thresholds?: ThresholdPill[];
  thresholdsLabel?: string;
  note?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Info size={14} className="text-indigo-500" />
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {heading}
        </h4>
      </div>

      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.title} className="space-y-1">
            <p className="text-[13px] font-bold text-[#15151f] dark:text-slate-100">
              {line.title}
              {line.weight ? (
                <span className="font-bold text-[#4F46E5]"> {line.weight}</span>
              ) : null}
            </p>
            {line.description.includes("\n") ? (
              <div className="space-y-1 text-xs leading-5 text-[#6b6b85] dark:text-slate-300">
                {(() => {
                  const [intro, ...rest] = line.description
                    .split("\n")
                    .map((item) => item.trim())
                    .filter(Boolean);

                  return (
                    <>
                      {intro ? <p>{intro}</p> : null}
                      {rest.length > 0 ? (
                        <ul className="space-y-1">
                          {rest.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span
                                aria-hidden="true"
                                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4F46E5]"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p className="text-xs leading-5 text-[#6b6b85] dark:text-slate-300">
                {line.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {thresholds ? (
        <div className="border-t border-dashed border-slate-200 pt-3 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {thresholdsLabel ?? "Thresholds"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {thresholds.map((threshold) => (
              <span
                key={threshold.label}
                className="inline-flex items-center justify-center gap-1.5 rounded-full px-[8px] py-[3px] text-[10px] font-bold leading-none"
                style={{ backgroundColor: threshold.bg, color: threshold.fg }}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center leading-none"
                >
                  {threshold.icon}
                </span>
                {threshold.label}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {note ? (
        <div className="border-t border-dashed border-slate-200 pt-3 dark:border-slate-700">
          <p className="text-xs italic leading-5 text-slate-500 dark:text-slate-400">
            {note}
          </p>
        </div>
      ) : null}

      {footer ? (
        <div className="border-t border-slate-200 pt-3 text-[10px] text-slate-400 dark:border-slate-700 dark:text-slate-500">
          {footer}
        </div>
      ) : null}
    </div>
  );
}

function MetricCardHeader({
  title,
  info,
  titleClassName = "text-xl font-bold text-gray-900 dark:text-slate-100",
  className = "flex items-center justify-between gap-3",
}: {
  title: string;
  info: ReactNode;
  titleClassName?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className={titleClassName}>
        {title}
      </h3>
      {info}
    </div>
  );
}


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



useEffect(() => {
  if (!allReviews?.length) {
    setRecentReviewsCount(0);
    return;
  }

  const oneMonthAgo = subMonths(new Date(), 1);

  const count = allReviews.filter((review) => {
    try {
      const dateStr =
        (review as any).published_at || review.date;

      if (!dateStr) return false;

      const reviewDate = parseISO(dateStr);

      return (
        !isNaN(reviewDate.getTime()) &&
        reviewDate >= oneMonthAgo
      );
    } catch {
      return false;
    }
  }).length;

  setRecentReviewsCount(count);
}, [allReviews]);




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
      let globalPerformanceColor = "green";

      if (avgRating >= 4.5) {
        globalPerformanceLabel =
          t("dashboard.excellent") || "Excellent";
        globalPerformanceColor = "green";
      } else if (avgRating >= 4.0) {
        globalPerformanceLabel = t("dashboard.good");
        globalPerformanceColor = "green";
      } else if (avgRating >= 3.0) {
        globalPerformanceLabel =
          t("dashboard.average") || "Average";
        globalPerformanceColor = "orange";
      } else {
        globalPerformanceLabel =
          t("dashboard.toImprove") || "Needs Improvement";
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
    let perceivedValueColor = "green";

    const sentimentRatio =
      positiveSentimentCount + negativeSentimentCount > 0
        ? positiveSentimentCount /
          (positiveSentimentCount + negativeSentimentCount)
        : 0.5;

    if (sentimentRatio >= 0.6) {
      perceivedValueLabel = t("dashboard.high");
      perceivedValueColor = "green";
    } else if (sentimentRatio >= 0.4) {
      perceivedValueLabel =
        t("dashboard.average") || "Average";
      perceivedValueColor = "orange";
    } else {
      perceivedValueLabel =
        t("dashboard.low") || "Low";
      perceivedValueColor = "red";
    }
    // 4. Expérience délivrée : basée sur les avis récents (10 derniers)
    const recentReviews = allReviews.slice(0, 10);
    const recentPositive = recentReviews.filter(r => r.rating >= 4).length;
    const recentNegative = recentReviews.filter(r => r.rating <= 2).length;
    const recentPositiveRatio = recentReviews.length > 0 ? recentPositive / recentReviews.length : 0;
    
  let deliveredExperienceLabel = t("dashboard.smooth");
let deliveredExperienceColor = "green";

if (recentPositiveRatio >= 0.7) {
  deliveredExperienceLabel = t("dashboard.smooth");
  deliveredExperienceColor = "green";
} else if (recentPositiveRatio >= 0.4) {
  deliveredExperienceLabel =
    t("dashboard.variable") || "Variable";
  deliveredExperienceColor = "orange";
} else {
  deliveredExperienceLabel =
    t("dashboard.toReview") || "Needs Review";
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
  const metricInfoHeading = t("dashboard.metricInfo.heading");
  const performanceThresholds = [
    { label: t("dashboard.toImprove"), icon: "🔴", bg: "#FCE4E4", fg: "#DC2626" },
    { label: t("dashboard.average"), icon: "🟠", bg: "#FEF1DC", fg: "#E89614" },
    { label: t("dashboard.good"), icon: "🟢", bg: "#E8F5E8", fg: "#16A34A" },
    { label: t("dashboard.excellent"), icon: "💎", bg: "#D1FAE5", fg: "#166534" },
  ];
  const satisfactionThresholds = [
  { label: t("dashboard.toReview"), icon: "🔴", bg: "#FCE4E4", fg: "#DC2626" },
  { label: t("dashboard.average"), icon: "🟠", bg: "#FEF1DC", fg: "#E89614" },
  { label: t("dashboard.good"), icon: "🟢", bg: "#E8F5E8", fg: "#16A34A" },
  { label: t("dashboard.waitingForData"), icon: "⚪", bg: "#F3F4F6", fg: "#9CA3AF" },
];
  const perceivedValueThresholds = [
    { label: t("dashboard.low"), icon: "🔴", bg: "#FCE4E4", fg: "#DC2626" },
    { label: t("dashboard.average"), icon: "🟠", bg: "#FEF1DC", fg: "#E89614" },
    { label: t("dashboard.high"), icon: "🟢", bg: "#E8F5E8", fg: "#16A34A" },
  ];
  const deliveredExperienceThresholds = [
    { label: t("dashboard.toReview"), icon: "🔴", bg: "#FCE4E4", fg: "#DC2626" },
    { label: t("dashboard.variable"), icon: "🟠", bg: "#FEF1DC", fg: "#E89614" },
    { label: t("dashboard.smooth"), icon: "🟢", bg: "#E8F5E8", fg: "#16A34A" },
  ];
  const hasReviewData = allReviews.length > 0;
  const satisfactionStatus = !hasReviewData
    ? { label: t("dashboard.waitingForData"), color: "#9CA3AF" }
    : metrics.satisfactionIndex.percentage >= 80
    ? { label: t("dashboard.good"), color: "#16A34A" }
    : metrics.satisfactionIndex.percentage >= 60
    ? { label: t("dashboard.average"), color: "#E89614" }
    : { label: t("dashboard.toReview"), color: "#DC2626" };

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
                    <CardContent className="p-4 space-y-3">
                      <MetricCardHeader
                        title={t("dashboard.metricInfo.reviewCountCardTitle")}
                        titleClassName="text-sm font-semibold text-gray-900 dark:text-slate-100"
                        className="flex items-center gap-2"
                        info={
                          <MetricInfoPopover
                            ariaLabel={`${metricInfoHeading} - ${t("dashboard.metricInfo.reviewCountCardTitle")}`}
                            side="bottom"
                            align="center"
                          >
                            <MetricInfoContent
                              heading={metricInfoHeading}
                              lines={[
                                {
                                  title: t("dashboard.metricInfo.description"),
                                  description: t("dashboard.metricInfo.reviewCountFormula"),
                                },
                              ]}
                            />
                          </MetricInfoPopover>
                        }
                      />

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-300 bg-blue-600 shadow-md flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            {recentReviewsCount} {t("dashboard.reviews")}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {t("dashboard.reviewsReceivedLast30Days")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border rounded-xl ${
                        avgRating >= 4
                          ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/40 dark:to-slate-900 border-green-200 dark:border-green-900/50"
                          : avgRating >= 3
                          ? "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-slate-900 border-orange-200 dark:border-orange-900/50"
                          : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-slate-900 border-red-200 dark:border-red-900/50"
                      }`}>
                      <CardContent className="p-4 space-y-3">
                        <MetricCardHeader
                          title={t("dashboard.metricInfo.averageRatingCardTitle")}
                          titleClassName="text-sm font-semibold text-gray-900 dark:text-slate-100"
                          className="flex items-center gap-2"
                          info={
                            <MetricInfoPopover
                              ariaLabel={`${metricInfoHeading} - ${t("dashboard.metricInfo.averageRatingCardTitle")}`}
                              side="bottom"
                              align="center"
                            >
                              <MetricInfoContent
                                heading={metricInfoHeading}
                                lines={[
                                  {
                                    title: t("dashboard.metricInfo.formula"),
                                    description: t("dashboard.metricInfo.averageRatingFormula"),
                                  },
                                  // {
                                  //   title: t("dashboard.metricInfo.source"),
                                  //   description: t("dashboard.metricInfo.averageRatingSource"),
                                  // },
                                ]}
                              />
                            </MetricInfoPopover>
                          }
                        />

                        <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-md ${
                          avgRating >= 4
                            ? "bg-green-600 border-green-300"
                            : avgRating >= 3
                            ? "bg-orange-500 border-orange-300"
                            : "bg-red-500 border-red-300"
                        }`}
                      >
                        <Star className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-slate-100">
                          {avgRating > 0 ? `${avgRating.toFixed(1)}/5` : t("dashboard.rating")}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-slate-400">
                          {avgRating > 0 ? t("dashboard.averageRating") : t("dashboard.waitingForData")}
                        </p>
                      </div>
                      {/* <div className="ml-auto self-start">
                        <MetricInfoPopover
                          title="Average Rating Calculation"
                          subtitle="Formula used to calculate the rating"
                          formula="(Sum of all ratings) ÷ (Total rated reviews)"
                          description="Only reviews containing a star rating are included in this calculation. Comment-only reviews are excluded."
                          icon={<Star size={16} className="text-primary" />}
                        />
                      </div> */}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`border rounded-xl ${
                                  totalReviewsForEstablishment > 0
                                    ? (validatedResponsesCount / totalReviewsForEstablishment) * 100 >= 80
                                      ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/40 dark:to-slate-900 border-green-200 dark:border-green-900/50"
                                      : (validatedResponsesCount / totalReviewsForEstablishment) * 100 >= 60
                                      ? "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-slate-900 border-orange-200 dark:border-orange-900/50"
                                      : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-slate-900 border-red-200 dark:border-red-900/50"
                                    : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950/40 dark:to-slate-900 border-gray-200 dark:border-gray-900/50"
                                }`}>
                    <CardContent className="p-4 space-y-3">
                      <MetricCardHeader
                        title={t("dashboard.metricInfo.validatedResponsesCardTitle")}
                        titleClassName="text-sm font-semibold text-gray-900 dark:text-slate-100"
                        className="flex items-center gap-2"
                        info={
                          <MetricInfoPopover
                            ariaLabel={`${metricInfoHeading} - ${t("dashboard.metricInfo.validatedResponsesCardTitle")}`}
                            side="bottom"
                            align="center"
                          >
                            <MetricInfoContent
                              heading={metricInfoHeading}
                              lines={[
                                {
                                  title: t("dashboard.metricInfo.description"),
                                  description: t("dashboard.metricInfo.validatedResponsesDescription"),
                                },
                                {
                                  title: t("dashboard.metricInfo.formula"),
                                  description: t("dashboard.metricInfo.validatedResponsesFormula"),
                                },
                              ]}
                            />
                          </MetricInfoPopover>
                        }
                      />

                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-md ${
                            totalReviewsForEstablishment > 0
                              ? (validatedResponsesCount / totalReviewsForEstablishment) * 100 >= 80
                                ? "bg-green-600 border-green-300"
                                : (validatedResponsesCount / totalReviewsForEstablishment) * 100 >= 60
                                ? "bg-orange-500 border-orange-300"
                                : "bg-red-500 border-red-300"
                              : "bg-gray-500 border-gray-300"
                          }`}
                        >
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>

                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            {validatedResponsesCount}/{totalReviewsForEstablishment}{" "}
                            {t("dashboard.responses")} {t("dashboard.validated")}
                          </p>

                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {t("dashboard.responses")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card   className={`border rounded-xl ${
                      metrics.satisfactionIndex.percentage >= 80
                        ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/40 dark:to-slate-900 border-green-200 dark:border-green-900/50"
                        : metrics.satisfactionIndex.percentage >= 60
                        ? "bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-slate-900 border-orange-200 dark:border-orange-900/50"
                        : "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-slate-900 border-red-200 dark:border-red-900/50"
                    }`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <MetricCardHeader
                        title={t("dashboard.metricInfo.satisfactionCardTitle")}
                        titleClassName="text-sm font-semibold text-gray-900 dark:text-slate-100"
                        className="flex items-center gap-2"
                        info={
                          <MetricInfoPopover
                            ariaLabel={`${metricInfoHeading} - ${t("dashboard.metricInfo.satisfactionCardTitle")}`}
                            side="bottom"
                            align="center"
                          >
                            <MetricInfoContent
                              heading={metricInfoHeading}
                              lines={[
                                {
                                  title: t("dashboard.metricInfo.description"),
                                  description: t("dashboard.metricInfo.satisfactionDescription"),
                                },
                                {
                                  title: t("dashboard.metricInfo.formula"),
                                  description: t("dashboard.metricInfo.satisfactionFormula"),
                                },
                              ]}
                            />
                          </MetricInfoPopover>
                        }
                      />

                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 shadow-md ${
                            metrics.satisfactionIndex.percentage >= 80
                              ? "bg-green-600 border-green-300"
                              : metrics.satisfactionIndex.percentage >= 60
                              ? "bg-orange-500 border-orange-300"
                              : "bg-red-500 border-red-300"
                          }`}
                        >
                          <Smile className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-slate-100">
                            {allReviews.length > 0
                              ? `${Math.round(metrics.satisfactionIndex.percentage)}%`
                              : t("dashboard.satisfaction")}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-slate-400">
                            {allReviews.length > 0 ? t("dashboard.satisfactionIndex") : t("dashboard.waitingForReviews")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto pt-6 pb-0">
            {/* Performance globale */}
            <Card className="bg-transparent border-0 shadow-none rounded-2xl">
            <CardContent
              className="relative flex flex-col items-center text-center"
              style={{
                background: "linear-gradient(135deg, #F7F1F9 0%, #EFEEFA 50%, #ECEFF8 100%)",
                borderRadius: 16,
                padding: "16px 12px 14px",
                minHeight: 338,
                boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
                height: "100%",
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              }}
            >
              <div className="absolute right-3 top-3 z-10">
                <MetricInfoPopover
                  ariaLabel={`${metricInfoHeading} - ${t("dashboard.globalPerformance")}`}
                  side="bottom"
                  align="center"
                >
                  <MetricInfoContent
                    heading={metricInfoHeading}
                    lines={[
                      {
                        title: t("dashboard.metricInfo.formula"),
                        description: t("dashboard.metricInfo.globalPerformanceFormula"),
                      },
                      {
                        title: t("dashboard.metricInfo.source"),
                        description: t("dashboard.metricInfo.globalPerformanceSource"),
                      },
                    ]}
                    thresholds={performanceThresholds}
                    thresholdsLabel={t("dashboard.metricInfo.thresholdsLabel")}
                  />
                </MetricInfoPopover>
              </div>

              <div className="mb-[10px] flex h-[84px] items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F3E8FE]">
                  <PerformanceIcon className="h-6 w-6 text-[#8B5CF6]" />
                </div>
              </div>

              <div className="mb-[10px] flex min-h-8 items-center justify-center text-[20px] font-bold leading-[1.2] text-[#15151f]">
                {t("dashboard.globalPerformance")}
              </div>

              <div className="mt-auto flex w-full flex-col items-center">
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 22px",
                    borderRadius: 999,
                    background:
                      metrics.globalPerformance.color === "green"
                        ? "rgb(22, 163, 74)"
                        : metrics.globalPerformance.color === "orange"
                        ? "rgb(249, 115, 22)"
                        : metrics.globalPerformance.color === "red"
                        ? "rgb(220, 38, 38)"
                        : "rgb(156, 163, 175)",
                    color: "rgb(255, 255, 255)",
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 50,
                  }}
                >
                  <PerformanceIcon className="h-[22px] w-[22px] text-white" />
                  {avgRating >= 4.5 && (
                    <span className="text-[12px] font-bold leading-none text-yellow-300">★</span>
                  )}
                  <span className="text-[14px] font-bold leading-none text-white">
                    {metrics.globalPerformance.label}
                  </span>
                </div>

                <p
                  className="w-full text-[11px]"
                  style={{
                    lineHeight: 1.45,
                    textAlign: "justify",
                    textAlignLast: "left",
                    textJustify: "inter-word",
                    color: "#6b6b85",
                    hyphens: "auto",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 3,
                    overflow: "hidden",
                    minHeight: "4.35em",
                    maxHeight: "4.35em",
                  }}
                >
                  {t("dashboard.basedOnRating")}
                </p>
              </div>
            </CardContent>
            </Card>
            {/* Indice de satisfaction */}
            <Card className="bg-transparent border-0 shadow-none rounded-2xl">
              <CardContent className="relative p-0">
                <div className="absolute right-3 top-3 z-10">
                  <MetricInfoPopover
                    ariaLabel={`${metricInfoHeading} - ${t("dashboard.satisfactionIndex")}`}
                    side="bottom"
                    align="center"
                  >
                    <MetricInfoContent
                      heading={metricInfoHeading}
                      lines={[
                        {
                          title: t("dashboard.metricInfo.description"),
                          description: t("dashboard.metricInfo.satisfactionDescription"),
                        },
                        {
                          title: t("dashboard.metricInfo.formula"),
                          description: t("dashboard.metricInfo.satisfactionFormula"),
                        },
                      ]}
                      thresholds={satisfactionThresholds}
                      thresholdsLabel={t("dashboard.metricInfo.thresholdsLabel")}
                    />
                  </MetricInfoPopover>
                </div>

                <SatisfactionGauge
                  value={hasReviewData ? metrics.satisfactionIndex.percentage : null}
                  label={t("dashboard.satisfactionIndex")}
                  status={satisfactionStatus.label}
                  statusColor={satisfactionStatus.color}
                  description={t("dashboard.identifyProblems")}
                  fallbackText={t("common.noData")}
                />
              </CardContent>
            </Card>

            {/* Valeur ressentie */}
            <Card className="bg-transparent border-0 shadow-none rounded-2xl">
              <CardContent
                className="relative flex flex-col items-center text-center"
                style={{
                  background: "linear-gradient(135deg, #F7F1F9 0%, #EFEEFA 50%, #ECEFF8 100%)",
                  borderRadius: 16,
                  padding: "16px 12px 14px",
                  minHeight: 338,
                  boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
                  height: "100%",
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                <div className="absolute right-3 top-3 z-10">
                  <MetricInfoPopover
                    ariaLabel={`${metricInfoHeading} - ${t("dashboard.perceivedValue")}`}
                    side="bottom"
                    align="center"
                  >
                    <MetricInfoContent
                      heading={metricInfoHeading}
                      lines={[
                        {
                          title: t("dashboard.metricInfo.description"),
                          description: t("dashboard.metricInfo.perceivedValueDescription"),
                        },
                        {
                          title: t("dashboard.metricInfo.formula"),
                          description: t("dashboard.metricInfo.perceivedValueFormula"),
                        },
                      ]}
                      thresholds={perceivedValueThresholds}
                      thresholdsLabel={t("dashboard.metricInfo.thresholdsLabel")}
                    />
                  </MetricInfoPopover>
                </div>

                <div className="mb-[10px] flex h-[84px] items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFE8EF]">
                    <HeartHandshake className="h-6 w-6 text-[#E11D48]" />
                  </div>
                </div>

                <div className="mb-[10px] flex min-h-8 items-center justify-center text-[20px] font-bold leading-[1.2] text-[#15151f]">
                  {t("dashboard.perceivedValue")}
                </div>

                <div className="mt-auto flex w-full flex-col items-center">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 22px",
                      borderRadius: 999,
                      background:
                        metrics.perceivedValue.color === "green"
                          ? "rgb(22, 163, 74)"
                          : metrics.perceivedValue.color === "orange"
                          ? "rgb(249, 115, 22)"
                          : metrics.perceivedValue.color === "red"
                          ? "rgb(220, 38, 38)"
                          : "rgb(156, 163, 175)",
                      color: "rgb(255, 255, 255)",
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 50,
                    }}
                  >
                    <HeartHandshake className="h-[22px] w-[22px] text-white" />
                    <span className="text-[14px] font-bold leading-none text-white">
                      {metrics.perceivedValue.label}
                    </span>
                  </div>

                  <p
                    className="w-full text-[11px]"
                    style={{
                      lineHeight: 1.45,
                      textAlign: "justify",
                      textAlignLast: "left",
                      textJustify: "inter-word",
                      color: "#6b6b85",
                      hyphens: "auto",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                      overflow: "hidden",
                      minHeight: "4.35em",
                      maxHeight: "4.35em",
                    }}
                  >
                    {t("dashboard.calculateScore")}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Expérience délivrée */}
            <Card className="bg-transparent border-0 shadow-none rounded-2xl">
              <CardContent
                className="relative flex flex-col items-center text-center"
                style={{
                  background: "linear-gradient(135deg, #F7F1F9 0%, #EFEEFA 50%, #ECEFF8 100%)",
                  borderRadius: 16,
                  padding: "16px 12px 14px",
                  minHeight: 338,
                  boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
                  height: "100%",
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                }}
              >
                <div className="absolute right-3 top-3 z-10">
                  <MetricInfoPopover
                    ariaLabel={`${metricInfoHeading} - ${t("dashboard.deliveredExperience")}`}
                    side="bottom"
                    align="center"
                  >
                    <MetricInfoContent
                      heading={metricInfoHeading}
                      lines={[
                        {
                          title: t("dashboard.metricInfo.description"),
                          description: t("dashboard.metricInfo.deliveredExperienceDescription"),
                        },
                        {
                          title: t("dashboard.metricInfo.formula"),
                          description: t("dashboard.metricInfo.deliveredExperienceFormula"),
                        },
                        {
                          title: t("dashboard.metricInfo.source"),
                          description: t("dashboard.metricInfo.deliveredExperienceSource"),
                        },
                      ]}
                      thresholds={deliveredExperienceThresholds}
                      thresholdsLabel={t("dashboard.metricInfo.thresholdsLabel")}
                    />
                  </MetricInfoPopover>
                </div>

                <div className="mb-[10px] flex h-[84px] items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5E8]">
                    <ClipboardCheck className="h-6 w-6 text-[#16A34A]" />
                  </div>
                </div>

                <div className="mb-[10px] flex min-h-8 items-center justify-center text-[20px] font-bold leading-[1.2] text-[#15151f]">
                  {t("dashboard.deliveredExperience")}
                </div>

                <div className="mt-auto flex w-full flex-col items-center">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 22px",
                      borderRadius: 999,
                      background:
                        metrics.deliveredExperience.color === "green"
                          ? "rgb(22, 163, 74)"
                          : metrics.deliveredExperience.color === "orange"
                          ? "rgb(249, 115, 22)"
                          : metrics.deliveredExperience.color === "red"
                          ? "rgb(220, 38, 38)"
                          : "rgb(156, 163, 175)",
                      color: "rgb(255, 255, 255)",
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 50,
                    }}
                  >
                    <ClipboardCheck className="h-[22px] w-[22px] text-white" />
                    <span className="text-[14px] font-bold leading-none text-white">
                      {metrics.deliveredExperience.label}
                    </span>
                  </div>

                  <p
                    className="w-full text-[11px]"
                    style={{
                      lineHeight: 1.45,
                      textAlign: "justify",
                      textAlignLast: "left",
                      textJustify: "inter-word",
                      color: "#6b6b85",
                      hyphens: "auto",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      WebkitLineClamp: 3,
                      overflow: "hidden",
                      minHeight: "4.35em",
                      maxHeight: "4.35em",
                    }}
                  >
                    {t("dashboard.summaryRecommendations")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
