import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Star, ArrowRight , BarChart3, User, LogOut, Home, Eye, Trash2, AlertTriangle, CheckCircle, Lightbulb, Target, ChevronDown, ChevronUp, ChevronRight, Building2, UtensilsCrossed, Wine, Users, MapPin, Clock, MessageSquare, Info, Loader2, Copy, Calendar, Download, ClipboardList, Bot, X, Reply, Send, List, Sparkles, AlertCircle, Frown, ThumbsUp, Flag, Zap, Flame, Globe, Layers, Check} from "lucide-react";
import { OverviewMetrics, Review, ThemeAnalysis } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { useAnalysisFilters } from "./AnalysisFiltersContext";
import { formatPeriodLabel } from "@/utils/filterReviews";
import { useEffect, useState } from "react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessType } from "@/config/industry";
import { ThemesDisplay } from "@/components/ThemesDisplay";
import { BusinessTypeOverrideModal } from "../BusinessTypeOverrideModal";
import { useEstablishmentStore } from "@/store/establishmentStore";
import i18n from "@/i18n/config"; // ✅ only this — no t, no bind at module level

interface OverviewSectionProps {
  data: OverviewMetrics;
  reviews?: Review[];
  insight?:any;
  themes?:ThemeAnalysis[];
  onSentimentFilter?: (sentiment: 'positive' | 'neutral' | 'negative') => void;
}

export function OverviewSection({ data, reviews, insight,themes,onSentimentFilter }: OverviewSectionProps) {
  const { t } = useTranslation();
  const { periodFilter } = useAnalysisFilters();
  const [hoveredSentiment, setHoveredSentiment] = useState<string | null>(null);

  const [openCard, setOpenCard] = useState<string | null>(null);
  const [showBusinessTypeOverrideModal, setShowBusinessTypeOverrideModal] =useState(false);
  const [byRating, setByRating] = useState<Record<string, number>>({});
  const [totalThemeMentionsPercentage, setTotalThemeMentionPercentage]=useState(0)
  const {  activePlaceId } =useEstablishmentStore();
  if (!data) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-slate-100 mb-1">
            1. {t("analysis.overview.title", "Vue d'ensemble")} – KPI principaux
          </h2>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-slate-900 rounded-lg text-center text-muted-foreground">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  // Formater le label de période
  const periodLabel = formatPeriodLabel(periodFilter);

 const translateTheme = (theme: string): string => {
    const themeLower = theme.toLowerCase();
    const translations: Record<string, string> = {
      "service / attente": t("charts.problems.serviceWait"),
      "qualité des plats": t("charts.problems.foodQuality"),
      prix: t("charts.problems.price"),
      "qualité / goût": t("charts.strengths.tasteQuality"),
      "ambiance agréable": t("charts.strengths.niceAmbiance"),
      rapidité: t("dashboard.speed"),
      cuisine: t("dashboard.cuisine"),
      service: t("dashboard.service"),
      ambiance: t("dashboard.ambiance"),
      "rapport qualité/prix": t("charts.strengths.valueForMoney"),
    };

    // Chercher une correspondance exacte ou partielle
    for (const [key, value] of Object.entries(translations)) {
      if (themeLower.includes(key) || key.includes(themeLower)) {
        return value;
      }
    }
    return theme; // Retourner le thème original si aucune traduction trouvée
  };
  const getTrendIcon = () => {
    if (data.trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />;
    if (data.trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />;
    if (data.trend === 'insufficient') return <Minus className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />;
    if (data.trend === 'partial') {
      // Pour partial, déterminer l'icône selon la direction si disponible
      if (data.trendValue !== null && data.trendValue !== undefined) {
        if (data.trendValue > 0) return <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />;
        if (data.trendValue < 0) return <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />;
      }
      return <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0" aria-hidden="true" />;
    }
    return <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />;
  };

  const getTrendColor = () => {
    if (data.trend === 'up') return 'text-green-600';
    if (data.trend === 'down') return 'text-red-600';
    if (data.trend === 'insufficient') return 'text-gray-400';
    if (data.trend === 'partial') {
      // Pour partial, déterminer la couleur selon la direction si disponible
      if (data.trendValue !== null && data.trendValue !== undefined) {
        if (data.trendValue > 0) return 'text-green-600';
        if (data.trendValue < 0) return 'text-red-600';
      }
      return 'text-amber-600';
    }
    return 'text-gray-600';
  };
  
  const getTrendLabel = () => {
    if (data.trend === 'partial' && data.trendValue !== null && data.trendValue !== undefined) {
      // Déterminer la direction même avec données partielles
      if (data.trendValue > 2) return t("analysis.overview.increasing", "En hausse");
      if (data.trendValue < -2) return t("analysis.overview.decreasing", "En baisse");
      return t("analysis.overview.stable", "Stable");
    }
    return null;
  };

  // Formater la valeur de tendance en pourcentage (format FR avec virgule, entre parenthèses)
  const formatTrendValue = (value: number | null | undefined, isPositive: boolean): string => {
    if (value === null || value === undefined || isNaN(value)) return '';
    // Format FR : virgule + 1 décimale + espace insécable avant %
    const formatted = Math.abs(value).toFixed(1).replace(
    '.',
    i18n.language === 'fr' ? ',' : '.'
    );
    const sign = isPositive ? '+' : '-';
    // Espace insécable (\u00A0) avant le % pour un meilleur rendu typographique
    return `(${sign}${formatted}\u00A0%)`;
  };

  // Formater la variation en points (format FR avec virgule)
  const formatDeltaPoints = (delta: number | null | undefined): string => {
    if (delta === null || delta === undefined || isNaN(delta)) return '';
    // Format FR : virgule + 1 décimale
    const formatted = Math.abs(delta).toFixed(1).replace(
    '.',
    i18n.language === 'fr' ? ',' : '.'
    );
    return delta >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  // Recalculer les métriques principales si des avis filtrés sont fournis
  let averageRating = data.averageRating;
  let totalReviews = data.totalReviews;
  let positivePercentage = data.positivePercentage;
  let neutralPercentage = data.neutralPercentage;
  let negativePercentage = data.negativePercentage;

  if (reviews && reviews.length > 0) {
    totalReviews = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r.note || 0), 0);
    averageRating = totalReviews > 0 ? sum / totalReviews : 0;

    const positiveCount = reviews.filter((r) => r.note >= 4).length;
    const neutralCount = reviews.filter((r) => r.note === 3).length;
    const negativeCount = reviews.filter((r) => r.note <= 2).length;

    positivePercentage = totalReviews > 0 ? (positiveCount / totalReviews) * 100 : 0;
    neutralPercentage = totalReviews > 0 ? (neutralCount / totalReviews) * 100 : 0;
    negativePercentage = totalReviews > 0 ? (negativeCount / totalReviews) * 100 : 0;
  }

  // Handler pour clic sur sentiment
  const handleSentimentClick = (sentiment: 'positive' | 'neutral' | 'negative') => {
    if (onSentimentFilter) {
      onSentimentFilter(sentiment);
    }
  };
  useEffect(()=>{
    const counts: Record<string, number> = {};
        for (let i = 1; i <= 5; i++) {
        counts[i] = reviews.filter((r) => (r.note ?? 0) === i).length;
        }
        const totalMention =themes?.reduce((sum, t) => sum + (t.count || 0),0) || 0;
        const totalMentionPercentage = totalReviews
        ? Math.round((Math.min(totalMention, totalReviews) / totalReviews) * 100)
        : 0;

        setTotalThemeMentionPercentage(totalMentionPercentage);
        setByRating(counts);

    }, [reviews, themes, totalReviews]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          1. {t("analysis.overview.title", "Vue d'ensemble")} – {t("analysis.overview.kpiTitle", "Key KPIs")}
          <InfoTooltip 
            content={t("analysis.overview.kpiTooltip", "KPI (indicateur clé) : mesure utilisée pour suivre rapidement la performance globale. Bénéfice : vous identifiez en un coup d'œil les tendances principales de votre établissement.")}
          />
        </h2>
        <p className="text-sm text-gray-100 italic">
          {periodLabel}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Note moyenne */}
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analysis.overview.averageRating", "Note moyenne")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="text-3xl font-bold">{averageRating.toFixed(1)}</span>
              <span className="text-muted-foreground">/ 5</span>
            </div>
          </CardContent>
        </Card>

        {/* Total avis */}
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analysis.overview.totalReviews", "Total avis")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold">{totalReviews}</span>
              <span className="text-muted-foreground">
                {t("analysis.overview.reviews", "avis")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tendance */}
        <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analysis.overview.trend", "Tendance")} {data.trend !== 'insufficient' && t("analysis.overview.trendAverage")}
            </CardTitle>
            <div className="absolute top-3 right-3">
              <InfoTooltip
                content={
                  data.trend === 'insufficient' 
                    ? t("analysis.overview.trendTooltip.insufficient")
                    : data.trend === 'partial'
                    ? t("analysis.overview.trendTooltip.partial")
                    : (
                      <div className="space-y-2 text-xs font-normal text-gray-600 dark:text-slate-300 leading-5">
                        <p className="font-medium mb-2">
                          {t("analysis.overview.trendTooltip.description")}
                        </p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                          <span>{t("analysis.overview.trendTooltip.up")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400 flex-shrink-0" aria-hidden="true" />
                          <span>{t("analysis.overview.trendTooltip.stable")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0" aria-hidden="true" />
                          <span>{t("analysis.overview.trendTooltip.down")}</span>
                        </div>
                      </div>
                    )
                }
                ariaLabel={t("analysis.overview.trendTooltipAria")}
              />
            </div>
          </CardHeader>
          <CardContent>
            {data.trend === 'insufficient' ? (
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <span className={`text-lg font-semibold ${getTrendColor()}`}>
                  {t("analysis.overview.insufficient", "Données insuffisantes")}
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {getTrendIcon()}
                  <span className={`text-lg font-semibold ${getTrendColor()}`}>
                    {data.trend === 'up' && (
                      <>
                        {t("analysis.overview.increasing", "En hausse")}
                        {data.trendValue !== null && data.trendValue !== undefined && (
                          <>
                            {data.trendDeltaPoints !== null && data.trendDeltaPoints !== undefined && (
                              <span className="ml-1 text-base">
                                {formatDeltaPoints(data.trendDeltaPoints)} pt
                              </span>
                            )}
                            <span className="ml-1 text-base">
                              {formatTrendValue(data.trendValue, true)}
                            </span>
                          </>
                        )}
                      </>
                    )}
                    {data.trend === 'down' && (
                      <>
                        {t("analysis.overview.decreasing", "En baisse")}
                        {data.trendValue !== null && data.trendValue !== undefined && (
                          <>
                            {data.trendDeltaPoints !== null && data.trendDeltaPoints !== undefined && (
                              <span className="ml-1 text-base">
                                {formatDeltaPoints(data.trendDeltaPoints)} pt
                              </span>
                            )}
                            <span className="ml-1 text-base">
                              {formatTrendValue(data.trendValue, false)}
                            </span>
                          </>
                        )}
                      </>
                    )}
                    {data.trend === 'stable' && (
                      <>
                        {t("analysis.overview.stable", "Stable")}
                        {data.trendValue !== null && data.trendValue !== undefined && data.trendDeltaPoints !== null && data.trendDeltaPoints !== undefined && (
                          <>
                            <span className="ml-1 text-base">
                              {formatDeltaPoints(data.trendDeltaPoints)} pt
                            </span>
                            <span className="ml-1 text-base">
                              {formatTrendValue(Math.abs(data.trendValue), data.trendValue >= 0)}
                            </span>
                          </>
                        )}
                      </>
                    )}
                    {data.trend === 'partial' && (
                      <>
                        {getTrendLabel() || t("analysis.overview.stable", "Stable")}
                        {data.trendValue !== null && data.trendValue !== undefined && (
                          <>
                            {data.trendDeltaPoints !== null && data.trendDeltaPoints !== undefined && (
                              <span className="ml-1 text-base">
                                {formatDeltaPoints(data.trendDeltaPoints)} pt
                              </span>
                            )}
                            <span className="ml-1 text-base">
                              {formatTrendValue(Math.abs(data.trendValue), data.trendValue >= 0)}
                            </span>
                          </>
                        )}
                      </>
                    )}
                  </span>
                  {data.trend === 'partial' && (
                    <Badge variant="outline" className="ml-2 text-xs bg-amber-50 text-amber-700 border-amber-300">
                      {t("analysis.overview.partialData", "Données partielles")}
                    </Badge>
                  )}
                </div>
                {data.trendValue !== null && data.trendValue !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {data.trend === 'partial' ? t("analysis.overview.trendComparison.partial") : t("analysis.overview.trendComparison.previous3Months")}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Répartition positive/neutre/négative - Une seule carte */}
      <Card className="border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avis positifs */}
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">{t("analysis.overview.positiveReviews", "Avis positifs")}</p>
              <p 
                className={`text-3xl font-bold text-green-500 mb-2 transition-all ${
                  onSentimentFilter ? 'cursor-pointer hover:text-green-600 hover:scale-105' : ''
                } ${hoveredSentiment === 'positive' ? 'scale-105' : ''}`}
                onClick={() => handleSentimentClick('positive')}
                onMouseEnter={() => setHoveredSentiment('positive')}
                onMouseLeave={() => setHoveredSentiment(null)}
              >
                {positivePercentage.toFixed(1)}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ width: `${positivePercentage}%` }}
                />
              </div>
              <p className="text-gray-400 dark:text-slate-500 text-xs">({t("analysis.overview.stars.4to5", "4-5 étoiles")})</p>
            </div>

            {/* Avis neutres */}
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">{t("analysis.overview.neutralReviews", "Avis neutres")}</p>
              <p 
                className={`text-3xl font-bold mb-2 transition-all ${
                  onSentimentFilter ? 'cursor-pointer hover:opacity-80 hover:scale-105' : ''
                } ${hoveredSentiment === 'neutral' ? 'scale-105' : ''}`}
                style={{ color: '#f59e0b' }}
                onClick={() => handleSentimentClick('neutral')}
                onMouseEnter={() => setHoveredSentiment('neutral')}
                onMouseLeave={() => setHoveredSentiment(null)}
              >
                {neutralPercentage.toFixed(1)}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                <div 
                  className="h-2 rounded-full transition-all" 
                  style={{ width: `${neutralPercentage}%`, backgroundColor: '#f59e0b' }}
                />
              </div>
              <p className="text-gray-400 dark:text-slate-500 text-xs">({t("analysis.overview.stars.3", "3 étoiles")})</p>
            </div>

            {/* Avis négatifs */}
            <div>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-2">{t("analysis.overview.negativeReviews", "Avis négatifs")}</p>
              <p 
                className={`text-3xl font-bold text-red-500 mb-2 transition-all ${
                  onSentimentFilter ? 'cursor-pointer hover:text-red-600 hover:scale-105' : ''
                } ${hoveredSentiment === 'negative' ? 'scale-105' : ''}`}
                onClick={() => handleSentimentClick('negative')}
                onMouseEnter={() => setHoveredSentiment('negative')}
                onMouseLeave={() => setHoveredSentiment(null)}
              >
                {negativePercentage.toFixed(1)}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all" 
                  style={{ width: `${negativePercentage}%` }}
                />
              </div>
              <p className="text-gray-400 dark:text-slate-500 text-xs">({t("analysis.overview.stars.1to2", "1-2 étoiles")})</p>
            </div>
          </div>
        </CardContent>
      </Card>

    {/* Analyse par thématiques et Décryptage des avis */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card
          className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 dark:bg-slate-900 dark:border-slate-800"
          onClick={() =>
            setOpenCard(
              openCard === "thematiques" ? null : "thematiques",
            )
          }
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3
                className="w-5 h-5"
                style={{ color: "#9234ea" }}
              />
              <p
                className="text-2xl font-bold"
                style={{ color: "#9234ea" }}
              >
                {totalThemeMentionsPercentage}%
              </p>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              {t("dashboard.themesAnalysis")}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t("dashboard.reviewsDistributionByCategories")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setOpenCard(
                  openCard === "thematiques" ? null : "thematiques",
                );
              }}
              className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-violet-50 dark:hover:bg-violet-950/40"
            >
              {openCard === "thematiques" ? (
                <ChevronUp className="w-3 h-3 text-violet-700" />
              ) : (
                <ChevronDown className="w-3 h-3 text-violet-700" />
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Décryptage des avis */}
        <Card
          className="relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 dark:bg-slate-900 dark:border-slate-800"
          onClick={() =>
            setOpenCard(
              openCard === "analyseDetaillee"
                ? null
                : "analyseDetaillee",
            )
          }
        >
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-[#5048e5]" />
              {data.totalReviews == null ? (
                <Skeleton className="h-8 w-14 inline-block animate-shimmer" />
              ) : (
                <p className="text-2xl font-bold text-[#5048e5] animate-in fade-in duration-300">
                  {data.totalReviews}
                </p>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              {t("dashboard.reviewsDecryption")}
            </p>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t("dashboard.completeDetailsRatingsThemes")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setOpenCard(
                  openCard === "analyseDetaillee"
                    ? null
                    : "analyseDetaillee",
                );
              }}
              className="absolute bottom-2 right-2 h-6 w-6 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/40"
            >
              {openCard === "analyseDetaillee" ? (
                <ChevronUp className="w-3 h-3 text-blue-600" />
              ) : (
                <ChevronDown className="w-3 h-3 text-blue-600" />
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contenu Analyse par thématiques - EN DESSOUS, pleine largeur */}
      {openCard === "thematiques" && (
        <Card className="mt-4 mb-8 dark:bg-slate-900 dark:border-slate-800" id="thematiques-content">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Utiliser le nouveau format v2 si disponible, sinon fallback v1 */}
              {insight?.analysis_version === "v2-auto-universal" ? (
                <ThemesDisplay
                  insight={insight}
                  themesUniversal={insight?.themes_universal || []}
                  themesIndustry={insight?.themes_industry || []}
                  businessType={
                    insight?.business_type as BusinessType | null
                  }
                  businessTypeConfidence={
                    insight?.business_type_confidence || null
                  }
                  businessTypeCandidates={
                    insight?.business_type_candidates || []
                  }
                  totalReviews={totalReviews || 1}
                  onOverrideClick={() =>
                    setShowBusinessTypeOverrideModal(true)
                  }
                />
              ) : insight?.themes && insight.themes.length > 0 ? (
                (() => {
                  const totalForThemes = totalReviews || 1;

                  // Calculer les pourcentages bruts
                  const themesWithPercentages = themes.map(
                    (theme: any) => {
                      const themeCount = theme.count || 0;
                      const rawPercentage =
                        (themeCount / totalForThemes) * 100;

                      // Calculer positifs et négatifs pour cette thématique
                      let positiveCount = 0;
                      let negativeCount = 0;

                      if (
                        theme.reviews &&
                        Array.isArray(theme.reviews)
                      ) {
                        theme.reviews.forEach((review: any) => {
                          const rating = review.rating || 0;
                          if (rating >= 4) positiveCount++;
                          else if (rating <= 2) negativeCount++;
                        });
                      } else {
                        const globalPositiveRatio =
                          insight?.positive_ratio || 0.7;
                        positiveCount = Math.round(
                          themeCount * globalPositiveRatio,
                        );
                        negativeCount = Math.round(
                          themeCount * (1 - globalPositiveRatio),
                        );
                      }

                      const totalCounted =
                        positiveCount + negativeCount;
                      const positivePercent =
                        totalCounted > 0
                          ? Math.round(
                              (positiveCount / totalCounted) * 100,
                            )
                          : 0;
                      const negativePercent =
                        totalCounted > 0
                          ? Math.round(
                              (negativeCount / totalCounted) * 100,
                            )
                          : 0;

                      return {
                        ...theme,
                        rawPercentage,
                        positivePercent,
                        negativePercent,
                      };
                    },
                  );

                  const totalPercentage =
                    themesWithPercentages.reduce(
                      (sum: number, t: any) => sum + t.rawPercentage,
                      0,
                    );

                  const themesNormalized = themesWithPercentages.map(
                    (theme: any) => ({
                      ...theme,
                      percentage:
                        totalPercentage > 0
                          ? Math.round(
                              (theme.rawPercentage /
                                totalPercentage) *
                                100,
                            )
                          : 0,
                    }),
                  );

                  const getThemeIcon = (themeName: string) => {
                    const name = themeName.toLowerCase();
                    if (
                      name.includes("cuisine") ||
                      name.includes("plat") ||
                      name.includes("nourriture")
                    ) {
                      return (
                        <UtensilsCrossed className="w-4 h-4 text-purple-500" />
                      );
                    } else if (
                      name.includes("service") ||
                      name.includes("personnel") ||
                      name.includes("accueil")
                    ) {
                      return (
                        <Users className="w-4 h-4 text-purple-500" />
                      );
                    } else if (
                      name.includes("ambiance") ||
                      name.includes("atmosphère") ||
                      name.includes("décor")
                    ) {
                      return (
                        <Wine className="w-4 h-4 text-purple-500" />
                      );
                    } else if (
                      name.includes("emplacement") ||
                      name.includes("localisation") ||
                      name.includes("lieu")
                    ) {
                      return (
                        <MapPin className="w-4 h-4 text-purple-500" />
                      );
                    }
                    return (
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                    );
                  };

                  const SentimentBadges: React.FC<{
                    positivePct?: number;
                    negativePct?: number;
                    className?: string;
                  }> = ({ positivePct, negativePct, className }) => {
                    const clampPct = (n?: number) => {
                      if (typeof n !== "number" || isNaN(n)) return 0;
                      return Math.max(
                        0,
                        Math.min(100, Math.round(n)),
                      );
                    };
                    const p = clampPct(positivePct);
                    const n = clampPct(negativePct);
                    return (
                      <div
                        className={`flex items-center gap-2 ${className ?? ""}`}
                      >
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

                  return themesNormalized.map(
                    (theme: any, index: number) => (
                      <div
                        key={index}
                        className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {getThemeIcon(theme.theme)}
                          <div className="flex-1">
                            <div className="font-medium">
                              {translateTheme(theme.theme)}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-slate-400">
                              {t("dashboard.percentageOfReviews", {
                                percentage: theme.percentage,
                              })}
                            </div>
                          </div>
                          <div className="ml-auto">
                            <SentimentBadges
                              positivePct={theme.positivePercent}
                              negativePct={theme.negativePercent}
                            />
                          </div>
                        </div>
                      </div>
                    ),
                  );
                })()
              ) : (
                <div className="text-center py-4 text-gray-500 dark:text-slate-400">
                  <p className="text-sm">
                    {t("dashboard.noThemesIdentified")}
                  </p>
                  <p className="text-xs mt-1">
                    {t("dashboard.analyzeEstablishmentToSeeThemes")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu Décryptage des avis - EN DESSOUS, pleine largeur */}
      {
      openCard === "analyseDetaillee" && (
        <Card className="mt-4 mb-8 dark:bg-slate-900 dark:border-slate-800">
          <CardContent>
            <div className="mt-6 space-y-8">
              {/* Répartition des avis par note */}
              <div>
                <h4 className="font-semibold text-lg mb-4">
                  {t("dashboard.distributionReviewsByRating")}
                </h4>
                {reviews && insight? (
                  <div className="space-y-3">
                    {
                    [5, 4, 3, 2, 1].map((star) => {
                      const count =
                          byRating[star] || 0;
                      const total = totalReviews || 1;
                      const percentage = Math.round(
                        (count / total) * 100,
                      );
                      const color =
                        star >= 4
                          ? "bg-green-500"
                          : star === 3
                            ? "bg-yellow-500"
                            : "bg-red-500";
                      return (
                        <div
                          key={star}
                          className="flex items-center gap-4"
                        >
                          <span className="w-20 text-sm text-gray-600 dark:text-slate-300 font-medium">
                            {star} {t("dashboard.stars")}{star > 1 ? "s" : ""}
                          </span>
                          <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-3">
                            <div
                              className={`${color} h-3 rounded-full`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-slate-300 w-20 text-right">
                            {count} ({percentage}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-slate-400">
                    <p>{t("dashboard.uploadReviewToSeeBreakdown")}</p>
                  </div>
                )}
              </div>

              {/* Thématiques récurrentes */}
              <div>
                <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {t("dashboard.recurringThemes")}
                </h4>
                {(() => {
                  // Mapper les données v2 (themes_universal et themes_industry) vers le format attendu
                  const isV2 =
                    insight?.analysis_version === "v2-auto-universal";
                  const hasAnalysis =
                    !!insight && !!insight.last_analyzed_at;

                  // Extraire et mapper themes_universal (format v2)
                  let themesUniversal: Array<{
                    theme: string;
                    count?: number;
                    importance?: number;
                  }> = [];
                  if (isV2 && insight?.themes_universal) {
                    try {
                      // Gérer le cas où c'est déjà un tableau ou une chaîne JSON
                      const universalData =
                        typeof insight.themes_universal === "string"
                          ? JSON.parse(insight.themes_universal)
                          : insight.themes_universal;
                      if (
                        Array.isArray(universalData) &&
                        universalData.length > 0
                      ) {
                        themesUniversal = universalData
                          .map((t: any) => ({
                            theme:
                              t.theme ||
                              t.name ||
                              String(t) ||
                              "Thématique",
                            count:
                              typeof t.count === "number"
                                ? t.count
                                : t.importance
                                  ? Math.round(t.importance / 10)
                                  : 0,
                            importance:
                              typeof t.importance === "number"
                                ? t.importance
                                : t.count
                                  ? t.count * 10
                                  : 0,
                          }))
                          .filter(
                            (t: any) =>
                              t.theme && t.theme !== "Thématique",
                          );
                      }
                    } catch (e) {
                      console.warn(
                        "[Dashboard] Erreur parsing themes_universal:",
                        e,
                      );
                    }
                  }

                  // Extraire et mapper themes_industry (format v2)
                  let themesIndustry: Array<{
                    theme: string;
                    count?: number;
                    importance?: number;
                  }> = [];
                  if (isV2 && insight?.themes_industry) {
                    try {
                      // Gérer le cas où c'est déjà un tableau ou une chaîne JSON
                      const industryData =
                        typeof insight.themes_industry === "string"
                          ? JSON.parse(insight.themes_industry)
                          : insight.themes_industry;

                      if (
                        Array.isArray(industryData) &&
                        industryData.length > 0
                      ) {
                        themesIndustry = industryData
                          .map((t: any) => ({
                            theme:
                              t.theme ||
                              t.name ||
                              String(t) ||
                              "Thématique",
                            count:
                              typeof t.count === "number"
                                ? t.count
                                : t.importance
                                  ? Math.round(t.importance / 10)
                                  : 0,
                            importance:
                              typeof t.importance === "number"
                                ? t.importance
                                : t.count
                                  ? t.count * 10
                                  : 0,
                          }))
                          .filter(
                            (t: any) =>
                              t.theme && t.theme !== "Thématique",
                          );
                      }
                    } catch (e) {
                      console.warn(
                        "[Dashboard] Erreur parsing themes_industry:",
                        e,
                      );
                    }
                  }

                  // Fallback v1 : utiliser themes si themes_universal est vide
                  if (
                    !isV2 &&
                    insight?.themes &&
                    Array.isArray(insight.themes) &&
                    themesUniversal.length === 0
                  ) {
                    themesUniversal = insight.themes.map(
                      (t: any) => ({
                        theme: t.theme || t.name || t,
                        count: t.count || 0,
                        importance: t.count ? t.count * 10 : 0,
                      }),
                    );
                  }

                  // Si aucune analyse n'existe, afficher le message d'invitation
                  if (
                    !hasAnalysis &&
                    themesUniversal.length === 0 &&
                    themesIndustry.length === 0
                  ) {
                    return (
                      <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                        <p>
                          {t("dashboard.importReviewsToSeeTheThemes")}
                        </p>
                      </div>
                    );
                  }

                  // Si une analyse existe mais pas de thèmes, afficher un message différent
                  if (
                    hasAnalysis &&
                    themesUniversal.length === 0 &&
                    themesIndustry.length === 0
                  ) {
                    return (
                      <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                        <p>
                          Aucune thématique identifiée pour le moment
                        </p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                          Les thématiques apparaîtront après l'analyse
                          de vos avis
                        </p>
                      </div>
                    );
                  }

                  // Afficher les thèmes avec ThemesDisplay
                  return (
                    <ThemesDisplay
                      insight={insight}
                      themesUniversal={themesUniversal}
                      themesIndustry={themesIndustry}
                      businessType={
                        insight?.business_type as BusinessType | null
                      }
                      businessTypeConfidence={
                        insight?.business_type_confidence || null
                      }
                      businessTypeCandidates={
                        insight?.business_type_candidates || []
                      }
                      totalReviews={totalReviews || 1}
                      onOverrideClick={() =>
                        setShowBusinessTypeOverrideModal(true)
                      }
                    />
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {showBusinessTypeOverrideModal && (
                <BusinessTypeOverrideModal
                  open={showBusinessTypeOverrideModal}
                  onOpenChange={setShowBusinessTypeOverrideModal}
                  placeId={activePlaceId}
                  currentType={insight?.business_type as BusinessType | null}
                  onSuccess={() => {
                    // Recharger les données après override
                    window.location.reload();
                  }}
                />
              )}
    </div>
    
  );
}
