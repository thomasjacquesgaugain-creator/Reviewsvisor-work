import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import { OverviewMetrics } from "@/types/analysis";
import { useTranslation } from "react-i18next";

interface OverviewSectionProps {
  data: OverviewMetrics;
}

export function OverviewSection({ data }: OverviewSectionProps) {
  const { t } = useTranslation();

  if (!data) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">1. {t("analysis.overview.title", "Vue d'ensemble")}</h2>
        <div className="p-4 bg-gray-50 rounded-lg text-center text-muted-foreground">
          <p>Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    if (data.trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (data.trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (data.trend === 'up') return 'text-green-600';
    if (data.trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">1. {t("analysis.overview.title", "Vue d'ensemble")}</h2>
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
              <span className="text-3xl font-bold">{data.averageRating.toFixed(1)}</span>
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
              <span className="text-3xl font-bold">{data.totalReviews}</span>
              <span className="text-muted-foreground">
                {t("analysis.overview.reviews", "avis")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tendance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("analysis.overview.trend", "Tendance")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {getTrendIcon()}
              <span className={`text-lg font-semibold ${getTrendColor()}`}>
                {data.trend === 'up' && t("analysis.overview.increasing", "En hausse")}
                {data.trend === 'down' && t("analysis.overview.decreasing", "En baisse")}
                {data.trend === 'stable' && t("analysis.overview.stable", "Stable")}
              </span>
              {data.trendValue && (
                <span className={`text-sm ${getTrendColor()}`}>
                  {data.trendValue > 0 ? '+' : ''}{data.trendValue.toFixed(1)}%
                </span>
              )}
            </div>
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
              <p className="text-3xl font-bold text-green-500 mb-2">{data.positivePercentage.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ width: `${data.positivePercentage}%` }}
                />
              </div>
              <p className="text-gray-400 text-xs">(4-5 étoiles)</p>
            </div>

            {/* Avis neutres */}
            <div>
              <p className="text-gray-500 text-sm mb-2">{t("analysis.overview.neutralReviews", "Avis neutres")}</p>
              <p className="text-3xl font-bold mb-2" style={{ color: '#f59e0b' }}>{data.neutralPercentage.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="h-2 rounded-full transition-all" 
                  style={{ width: `${data.neutralPercentage}%`, backgroundColor: '#f59e0b' }}
                />
              </div>
              <p className="text-gray-400 text-xs">(3 étoiles)</p>
            </div>

            {/* Avis négatifs */}
            <div>
              <p className="text-gray-500 text-sm mb-2">{t("analysis.overview.negativeReviews", "Avis négatifs")}</p>
              <p className="text-3xl font-bold text-red-500 mb-2">{data.negativePercentage.toFixed(1)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all" 
                  style={{ width: `${data.negativePercentage}%` }}
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
