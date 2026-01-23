import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Star, ArrowRight } from "lucide-react";
import { OverviewMetrics, Review } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { useAnalysisFilters } from "./AnalysisFiltersContext";
import { formatPeriodLabel } from "@/utils/filterReviews";
import { useState } from "react";
import { InfoTooltip } from "@/components/ui/InfoTooltip";

interface OverviewSectionProps {
  data: OverviewMetrics;
  reviews?: Review[];
  onSentimentFilter?: (sentiment: 'positive' | 'neutral' | 'negative') => void;
}

export function OverviewSection({ data, reviews, onSentimentFilter }: OverviewSectionProps) {
  const { t } = useTranslation();
  const { periodFilter } = useAnalysisFilters();
  const [hoveredSentiment, setHoveredSentiment] = useState<string | null>(null);

  if (!data) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">
            1. {t("analysis.overview.title", "Vue d'ensemble")} – KPI principaux
          </h2>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg text-center text-muted-foreground">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  // Formater le label de période
  const periodLabel = formatPeriodLabel(periodFilter);

  const getTrendIcon = () => {
    if (data.trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500 flex-shrink-0" aria-hidden="true" />;
    if (data.trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500 flex-shrink-0" aria-hidden="true" />;
    if (data.trend === 'insufficient') return <Minus className="w-4 h-4 text-gray-400 flex-shrink-0" aria-hidden="true" />;
    return <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden="true" />;
  };

  const getTrendColor = () => {
    if (data.trend === 'up') return 'text-green-600';
    if (data.trend === 'down') return 'text-red-600';
    if (data.trend === 'insufficient') return 'text-gray-400';
    return 'text-gray-600';
  };

  // Formater la valeur de tendance en pourcentage (format FR avec virgule, entre parenthèses)
  const formatTrendValue = (value: number | null | undefined, isPositive: boolean): string => {
    if (value === null || value === undefined || isNaN(value)) return '';
    // Format FR : virgule + 1 décimale + espace insécable avant %
    const formatted = Math.abs(value).toFixed(1).replace('.', ',');
    const sign = isPositive ? '+' : '-';
    // Espace insécable (\u00A0) avant le % pour un meilleur rendu typographique
    return `(${sign}${formatted}\u00A0%)`;
  };

  // Formater la variation en points (format FR avec virgule)
  const formatDeltaPoints = (delta: number | null | undefined): string => {
    if (delta === null || delta === undefined || isNaN(delta)) return '';
    // Format FR : virgule + 1 décimale
    const formatted = Math.abs(delta).toFixed(1).replace('.', ',');
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
          1. {t("analysis.overview.title", "Vue d'ensemble")} – KPI principaux
          <InfoTooltip 
            content="KPI (indicateur clé) : mesure utilisée pour suivre rapidement la performance globale. Bénéfice : vous identifiez en un coup d'œil les tendances principales de votre établissement."
          />
        </h2>
        <p className="text-sm text-gray-500 italic">
          {periodLabel}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Note moyenne */}
        <Card>
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
        <Card>
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
        <Card>
          <CardHeader className="pb-3 relative">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analysis.overview.trend", "Tendance")} {data.trend !== 'insufficient' && '(note moyenne)'}
            </CardTitle>
            <div className="absolute top-3 right-3">
              <InfoTooltip
                content={
                  data.trend === 'insufficient' 
                    ? "Données insuffisantes pour calculer la tendance. Au moins 5 avis sont nécessaires dans chaque période de 3 mois."
                    : (
                      <div className="space-y-2 text-xs font-normal text-gray-600 leading-5">
                        <p className="font-medium mb-2">
                          Variation (%) de la note moyenne sur les 3 derniers mois comparée aux 3 mois précédents.
                        </p>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" aria-hidden="true" />
                          <span>En hausse — Progression observée sur la période analysée.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" aria-hidden="true" />
                          <span>Stable — Aucune variation significative détectée.</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingDown className="w-3.5 h-3.5 text-red-500 flex-shrink-0" aria-hidden="true" />
                          <span>En baisse — Diminution observée sur la période analysée.</span>
                        </div>
                      </div>
                    )
                }
                ariaLabel="Explication des tendances"
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
                  </span>
                </div>
                {data.trendValue !== null && data.trendValue !== undefined && (
                  <p className="text-xs text-gray-500 mt-1">
                    vs 3 mois précédents
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Répartition positive/neutre/négative - Une seule carte */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Avis positifs */}
            <div>
              <p className="text-gray-500 text-sm mb-2">{t("analysis.overview.positiveReviews", "Avis positifs")}</p>
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
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ width: `${positivePercentage}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs">(4-5 étoiles)</p>
            </div>

            {/* Avis neutres */}
            <div>
              <p className="text-gray-500 text-sm mb-2">{t("analysis.overview.neutralReviews", "Avis neutres")}</p>
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
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="h-2 rounded-full transition-all" 
                  style={{ width: `${neutralPercentage}%`, backgroundColor: '#f59e0b' }}
                />
              </div>
              <p className="text-gray-400 text-xs">(3 étoiles)</p>
            </div>

            {/* Avis négatifs */}
            <div>
              <p className="text-gray-500 text-sm mb-2">{t("analysis.overview.negativeReviews", "Avis négatifs")}</p>
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
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all" 
                  style={{ width: `${negativePercentage}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs">(1-2 étoiles)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
