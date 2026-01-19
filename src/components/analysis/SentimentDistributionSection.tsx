import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SentimentDistribution, Review } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { useState } from "react";

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

  return (
    <Card className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' }}>
      <CardHeader className="p-6">
        <CardTitle className="text-lg font-semibold text-gray-800">{t("analysis.sentiment.title", "Répartition des sentiments")}</CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {total > 0 ? (
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
                  stroke="#fff"
                  strokeWidth={3}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      style={{
                        filter: activeIndex === index ? 'brightness(1.15) drop-shadow(0 4px 8px rgba(0,0,0,0.2))' : 'none',
                        transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                        transformOrigin: 'center',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  cursor={false}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as typeof chartData[0];
                      const percent = data.percentage || ((data.value / total) * 100).toFixed(1);
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                          <p className="font-semibold text-gray-800">{data.name}</p>
                          <p style={{ color: data.color }} className="text-lg font-bold">
                            {data.value} avis ({percent}%)
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
              <div className="p-4 bg-green-50 rounded-xl border border-green-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">{t("analysis.sentiment.positive", "Positifs")}</p>
                  <p className="text-2xl font-bold text-green-600">{positiveCount}</p>
                  <p className="text-xs text-gray-500">({((positiveCount/total)*100).toFixed(1)}% du total)</p>
                </div>
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
              </div>
              
              {/* Carte Neutres */}
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">{t("analysis.sentiment.neutral", "Neutres")}</p>
                  <p className="text-2xl font-bold text-orange-500">{neutralCount}</p>
                  <p className="text-xs text-gray-500">({((neutralCount/total)*100).toFixed(1)}% du total)</p>
                </div>
                <div className="w-10 h-10 bg-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">−</span>
                </div>
              </div>
              
              {/* Carte Négatifs */}
              <div className="p-4 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">{t("analysis.sentiment.negative", "Négatifs")}</p>
                  <p className="text-2xl font-bold text-red-500">{negativeCount}</p>
                  <p className="text-xs text-gray-500">({((negativeCount/total)*100).toFixed(1)}% du total)</p>
                </div>
                <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✗</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            <p>{t("analysis.sentiment.noData", "Aucune donnée disponible")}</p>
          </div>
        )}
        
        {total > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-gray-500">
              Total : <span className="font-bold text-gray-800">{total} avis</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}