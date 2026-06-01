import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SentimentDistribution, Review } from "@/types/analysis";
import { useTranslation,Trans } from "react-i18next";
import { useState } from "react";
import { useAnalysisFilters } from "./AnalysisFiltersContext";

interface SentimentDistributionSectionProps {
  data?: SentimentDistribution;
  reviews?: Review[]; // Avis bruts pour calcul direct
}

const COLORS = {
  positive: {
    main: '#22c55e',
    light: '#4ade80',
    dark: '#15803d',
    gradient: ['#4ade80', '#22c55e', '#15803d']
  },
  neutral: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    gradient: ['#fbbf24', '#f59e0b', '#d97706']
  },
  negative: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    gradient: ['#f87171', '#ef4444', '#dc2626']
  }
};

export function SentimentDistributionSection({ data, reviews }: SentimentDistributionSectionProps) {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { ratingFilter, setRatingFilter } = useAnalysisFilters();
  

  // Calculer depuis les reviews bruts si disponibles (plus fiable)
  let positiveCount = 0;
  let neutralCount = 0;
  let negativeCount = 0;
  let total = 0;

  if (reviews && reviews.length > 0) {
    console.log('[SentimentDistributionSection] Reviews reçus:', reviews);
    
    // Calcul correct basé sur les vrais avis
    positiveCount = reviews.filter(r => {
      const note = r.note || (r as any).rating || 0;
      return note >= 4;
    }).length;
    
    neutralCount = reviews.filter(r => {
      const note = r.note || (r as any).rating || 0;
      return note === 3;
    }).length;
    
    negativeCount = reviews.filter(r => {
      const note = r.note || (r as any).rating || 0;
      return note <= 2;
    }).length;
    
    total = reviews.length;
    
    console.log('[SentimentDistributionSection] Calcul sentiments:', { 
      positifs: positiveCount, 
      neutres: neutralCount, 
      negatifs: negativeCount, 
      total 
    });
  } else if (data) {
    // Fallback : utiliser les données transformées
    positiveCount = data.positive || 0;
    neutralCount = data.neutral || 0;
    negativeCount = data.negative || 0;
    total = positiveCount + neutralCount + negativeCount;
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("analysis.sentiment.title", "Répartition des sentiments")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>{t("analysis.sentiment.noData", "Aucune donnée disponible")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  const chartData = [
    {
      name: t("analysis.sentiment.positive", "Positifs"),
      value: positiveCount,
      percentage: total > 0 ? ((positiveCount / total) * 100).toFixed(1) : 0,
      color: COLORS.positive.main,
      gradient: COLORS.positive.gradient
    },
    {
      name: t("analysis.sentiment.neutral", "Neutres"),
      value: neutralCount,
      percentage: total > 0 ? ((neutralCount / total) * 100).toFixed(1) : 0,
      color: COLORS.neutral.main,
      gradient: COLORS.neutral.gradient
    },
    {
      name: t("analysis.sentiment.negative", "Négatifs"),
      value: negativeCount,
      percentage: total > 0 ? ((negativeCount / total) * 100).toFixed(1) : 0,
      color: COLORS.negative.main,
      gradient: COLORS.negative.gradient
    }
  ];

  const positiveShare = total > 0 ? positiveCount / total : 0;
  const positiveOnTen = total > 0 ? Math.round(positiveShare * 10) : 0;
  const nonPositive = total - positiveCount;
  const isLowVolume = total > 0 && total < 10;

  const handleClickSentiment = (type: "positive" | "neutral" | "negative") => {
    const target =
      type === "positive" ? "POS" : type === "neutral" ? "NEU" : "NEG";
    if (ratingFilter === target) {
      setRatingFilter("ALL");
    } else {
      setRatingFilter(target as any);
    }
  };

  return (
    <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="p-6">
        <CardTitle className="text-lg font-semibold text-foreground">{t("analysis.sentiment.title", "Répartition des sentiments")}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {total > 0 ? (
          <>
            <div className="mb-4 space-y-1">
              <p className="text-sm text-muted-foreground">
                <Trans
                  i18nKey={
                    nonPositive > 0
                      ? "analysis.sentiment.withAttention"
                      : "analysis.sentiment.positiveOnly"
                  }
                  values={{
                    positive: positiveCount,
                    total: total,
                    nonPositive: nonPositive,
                  }}
                  components={{
                    bold: <span className="font-semibold text-foreground" />,
                  }}
                />
              </p>
              {isLowVolume && (
                <p className="text-xs text-amber-600">
                  {t("analysis.sentiment.limitedReviews", "Analyse basée sur un nombre limité d’avis.")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Camembert donut à gauche */}
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    stroke="hsl(var(--background))"
                    strokeWidth={3}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.map((entry, index) => {
                      const isActive =
                        (index === 0 && ratingFilter === "POS") ||
                        (index === 1 && ratingFilter === "NEU") ||
                        (index === 2 && ratingFilter === "NEG");

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          style={{
                            filter: isActive
                              ? "brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.25))"
                              : activeIndex === index
                              ? "brightness(1.1)"
                              : "none",
                            transform:
                              isActive || activeIndex === index
                                ? "scale(1.05)"
                                : "scale(1)",
                            transformOrigin: "center",
                            transition: "all 0.2s ease",
                            cursor: "pointer",
                          }}
                          onMouseEnter={() => setActiveIndex(index)}
                          onMouseLeave={() => setActiveIndex(null)}
                          onClick={() =>
                            handleClickSentiment(
                              index === 0
                                ? "positive"
                                : index === 1
                                ? "neutral"
                                : "negative"
                            )
                          }
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as (typeof chartData)[0];
                        const percent =
                          data.percentage ||
                          ((data.value / total) * 100).toFixed(1);
                        return (
                          <div className="rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg">
                            <p className="font-semibold text-foreground">
                              {data.name}
                            </p>
                            <p
                              style={{ color: data.color }}
                              className="text-lg font-bold"
                            >
                              {data.value} {t("analysis.sentiment.reviews", "avis")} ({percent}%)
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            
            {/* Stats à droite */}
            <div className="space-y-4">
              {/* Carte Positifs */}
              <button
                type="button"
                // onClick={() => handleClickSentiment("positive")}
                className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-colors cursor-default ${
                  ratingFilter === "POS"
                    ? "bg-green-100 border-green-400 dark:bg-green-950/40 dark:border-green-900/50"
                    : "bg-green-50 border-green-100 hover:bg-green-100 dark:bg-green-950/20 dark:border-green-900/40 dark:hover:bg-green-950/40"
                }`}
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("analysis.sentiment.positive", "Positifs")}
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {positiveCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {((positiveCount / total) * 100).toFixed(1)}% {t("analysis.sentiment.ofTotal", "du total")}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              </button>
              
              {/* Carte Neutres */}
              <button
                type="button"
                // onClick={() => handleClickSentiment("neutral")}
                className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-colors cursor-default ${
                  ratingFilter === "NEU"
                    ? "bg-orange-100 border-orange-400 dark:bg-orange-950/40 dark:border-orange-900/50"
                    : "bg-orange-50 border-orange-100 hover:bg-orange-100 dark:bg-orange-950/20 dark:border-orange-900/40 dark:hover:bg-orange-950/40"
                }`}
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("analysis.sentiment.neutral", "Neutres")}
                  </p>
                  <p className="text-2xl font-bold text-orange-500">
                    {neutralCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {((neutralCount / total) * 100).toFixed(1)}% {t("analysis.sentiment.ofTotal", "du total")}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">−</span>
                </div>
              </button>
              
              {/* Carte Négatifs */}
              <button
                type="button"
                // onClick={() => handleClickSentiment("negative")}
                className={`w-full text-left p-4 rounded-xl border flex justify-between items-center transition-colors cursor-default ${
                  ratingFilter === "NEG"
                    ? "bg-red-100 border-red-400 dark:bg-red-950/40 dark:border-red-900/50"
                    : "bg-red-50 border-red-100 hover:bg-red-100 dark:bg-red-950/20 dark:border-red-900/40 dark:hover:bg-red-950/40"
                }`}
              >
                <div>
                  <p className="text-sm text-muted-foreground">
                    {t("analysis.sentiment.negative", "Négatifs")}
                  </p>
                  <p className="text-2xl font-bold text-red-500">
                    {negativeCount}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {((negativeCount / total) * 100).toFixed(1)}% {t("analysis.sentiment.ofTotal", "du total")}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✗</span>
                </div>
              </button>
            </div>
          </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            <p>{t("analysis.sentiment.noData", "Aucune donnée disponible")}</p>
          </div>
        )}
        
        {total > 0 && (
          <div className="mt-6 pt-4 border-t border-border text-center">
            <p className="text-muted-foreground">
              {t("analysis.sentiment.total", "Total:")} <span className="font-bold text-foreground">{total} {t("analysis.sentiment.reviews", "avis")}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}