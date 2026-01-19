import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Label } from "recharts";
import { TimeSeriesDataPoint, Review } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { useState, useMemo } from "react";
import { format, parseISO, startOfWeek, startOfMonth, startOfYear, getWeek, subDays, subMonths, subWeeks, subYears } from "date-fns";
import { fr } from "date-fns/locale";
import { getRatingEvolution, Granularity as RatingGranularity } from "@/utils/ratingEvolution";
import { TrendingUp, BarChart3 } from "lucide-react";

interface HistorySectionProps {
  data?: TimeSeriesDataPoint[];
  reviews?: Review[]; // Avis bruts pour calcul direct
}

type Granularity = 'day' | 'week' | 'month' | 'year';

// Mapper Granularity vers RatingGranularity
function mapGranularity(g: Granularity): RatingGranularity {
  switch (g) {
    case 'day': return 'jour';
    case 'week': return 'semaine';
    case 'month': return 'mois';
    case 'year': return 'année';
    default: return 'mois';
  }
}

export function HistorySection({ data, reviews }: HistorySectionProps) {
  const { t, i18n } = useTranslation();
  // États séparés pour chaque graphique
  const [periodNoteMoyenne, setPeriodNoteMoyenne] = useState<Granularity>('month');
  const [periodVolumeAvis, setPeriodVolumeAvis] = useState<Granularity>('month');

  // Calculer depuis les avis bruts en utilisant getRatingEvolution (même logique que "Indicateurs clés")
  const processedData = useMemo(() => {
    // DEBUG: Afficher les données reçues
    console.log('[HistorySection] Reviews reçus:', reviews);
    console.log('[HistorySection] Données reçues:', {
      hasData: !!data,
      dataLength: data?.length || 0,
      hasReviews: !!reviews,
      reviewsLength: reviews?.length || 0,
      granularity: periodNoteMoyenne
    });

    // Si on a des reviews bruts, utiliser getRatingEvolution (même logique que "Indicateurs clés")
    if (reviews && reviews.length > 0) {
      console.log('[HistorySection] 🔍 DEBUG - Avis récupérés:', reviews);
      
      // Convertir les reviews au format attendu par getRatingEvolution
      const reviewsForEvolution = reviews
        .filter(r => {
          const note = r.note || (r as any).rating || 0;
          const dateStr = (r as any).published_at || (r as any).inserted_at || (r as any).created_at || r.date || '';
          return note >= 1 && note <= 5 && dateStr;
        })
        .map(r => ({
          rating: r.note || (r as any).rating || 0,
          published_at: (r as any).published_at || (r as any).inserted_at || (r as any).created_at || r.date || '',
          inserted_at: (r as any).inserted_at || (r as any).created_at || r.date || ''
        }));

      // Trouver la date de départ (premier avis ou date d'il y a 12 mois)
      const allDates = reviewsForEvolution
        .map(r => {
          try {
            return parseISO(r.published_at);
          } catch {
            return null;
          }
        })
        .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
        .sort((a, b) => a.getTime() - b.getTime());
      
      const startDate = allDates.length > 0 ? allDates[0] : subMonths(new Date(), 12);

      // Utiliser getRatingEvolution avec la granularité mappée
      const ratingGranularity = mapGranularity(periodNoteMoyenne);
      const evolutionData = getRatingEvolution(
        reviewsForEvolution,
        startDate,
        ratingGranularity,
        i18n.language || 'fr'
      );

      console.log('[HistorySection] 🔍 DEBUG - Données du graphique (getRatingEvolution):', evolutionData);

      // Convertir au format attendu par le graphique (label au lieu de mois)
      const chartData = evolutionData.map(point => ({
        date: point.fullDate,
        label: point.mois,
        rating: point.note
      }));

      console.log('[HistorySection] ✅ Données finales pour le graphique:', chartData);

      return chartData;
    }

    // Fallback : utiliser les données agrégées existantes (ancien système)
    if (!data || data.length === 0) return [];

    let filtered = (data || []).map(point => ({
      date: point.date || '',
      rating: point.rating || 0,
      count: point.count || 0
    })).filter(point => point.date);

    // Limiter les données selon le filtre choisi
    const now = new Date();
    let cutoffDate: Date;
    
    switch (periodNoteMoyenne) {
      case 'day':
        cutoffDate = subDays(now, 30); // 30 derniers jours
        break;
      case 'week':
        cutoffDate = subWeeks(now, 12); // 12 dernières semaines
        break;
      case 'month':
        cutoffDate = subMonths(now, 12); // 12 derniers mois
        break;
      case 'year':
        cutoffDate = subYears(now, 5); // 5 dernières années
        break;
      default:
        cutoffDate = subMonths(now, 12);
    }

    // Filtrer par date de coupure
    filtered = filtered.filter(point => {
      try {
        const date = parseISO(point.date);
        return !isNaN(date.getTime()) && date >= cutoffDate;
      } catch {
        return false;
      }
    });

    // Grouper les données selon la granularité
    const grouped = new Map<string, { sum: number; count: number; totalCount: number; rating: number }>();

    filtered.forEach(point => {
      try {
        const date = parseISO(point.date);
        if (isNaN(date.getTime())) return;

        let key: string;
        let label: string;

        switch (periodNoteMoyenne) {
          case 'day':
            key = format(date, 'yyyy-MM-dd');
            label = format(date, 'dd MMM', { locale: fr });
            break;
          case 'week':
            const weekStart = startOfWeek(date, { locale: fr });
            key = format(weekStart, 'yyyy-MM-dd');
            const weekNum = getWeek(date, { locale: fr });
            label = `Sem. ${weekNum}`;
            break;
          case 'month':
            const monthStart = startOfMonth(date);
            key = format(monthStart, 'yyyy-MM');
            label = format(date, 'MMM yyyy', { locale: fr });
            break;
          case 'year':
            const yearStart = startOfYear(date);
            key = format(yearStart, 'yyyy');
            label = format(date, 'yyyy');
            break;
          default:
            return;
        }

        const existing = grouped.get(key) || { sum: 0, count: 0, totalCount: 0, rating: 0 };
        existing.sum += point.rating * point.count;
        existing.count += point.count;
        existing.totalCount += point.count;
        existing.rating = existing.count > 0 ? existing.sum / existing.count : 0;
        grouped.set(key, existing);
      } catch (e) {
        // Ignorer les dates invalides
      }
    });

    return Array.from(grouped.entries())
      .map(([key, data]) => {
        let label: string;
        try {
          // Construire la date complète pour le parsing
          const dateStr = periodNoteMoyenne === 'day' ? key : 
                          periodNoteMoyenne === 'week' ? key :
                          periodNoteMoyenne === 'month' ? key + '-01' : 
                          key + '-01-01';
          const date = parseISO(dateStr);
          
          switch (periodNoteMoyenne) {
            case 'day':
              label = format(date, 'dd MMM', { locale: fr });
              break;
            case 'week':
              label = `Sem. ${getWeek(date, { locale: fr })}`;
              break;
            case 'month':
              label = format(date, 'MMM yyyy', { locale: fr });
              break;
            case 'year':
              label = format(date, 'yyyy');
              break;
            default:
              label = key;
          }
        } catch {
          label = key;
        }

        return {
          date: key,
          label,
          rating: data.rating
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [data, reviews, periodNoteMoyenne, i18n.language]);

  // Calculer les données du volume d'avis (empilé)
  const volumeData = useMemo(() => {
    console.log('[HistorySection] Volume Avis - Reviews reçus:', reviews);
    
    if (!reviews || reviews.length === 0) {
      console.log('[HistorySection] Volume Avis - Aucun review disponible');
      return [];
    }

    // Convertir les reviews et filtrer les valides
    const validReviews = reviews
      .filter(r => {
        const note = r.note || (r as any).rating || 0;
        const dateStr = (r as any).published_at || (r as any).inserted_at || (r as any).created_at || r.date || '';
        return note >= 1 && note <= 5 && dateStr;
      })
      .map(r => ({
        rating: r.note || (r as any).rating || 0,
        dateStr: (r as any).published_at || (r as any).inserted_at || (r as any).created_at || r.date || ''
      }));

    if (validReviews.length === 0) return [];

    // Trouver la date de départ
    const allDates = validReviews
      .map(r => {
        try {
          return parseISO(r.dateStr);
        } catch {
          return null;
        }
      })
      .filter((d): d is Date => d !== null && !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    
    const startDate = allDates.length > 0 ? allDates[0] : subMonths(new Date(), 12);
    const ratingGranularity = mapGranularity(periodVolumeAvis);
    
    // Utiliser getRatingEvolution pour obtenir les périodes
    const evolutionData = getRatingEvolution(
      validReviews.map(r => ({ rating: r.rating, published_at: r.dateStr, inserted_at: r.dateStr })),
      startDate,
      ratingGranularity,
      i18n.language || 'fr'
    );

    // Pour chaque période générée (TOUTES les dates, même sans avis), compter les avis
    return evolutionData.map(period => {
      const periodDate = parseISO(period.fullDate);
      if (isNaN(periodDate.getTime())) {
        return {
          date: period.mois,
          fullDate: period.fullDate,
          positifs: 0,
          neutres: 0,
          negatifs: 0,
          total: 0
        };
      }

      // Déterminer les limites de la période
      let periodStart: Date;
      let periodEnd: Date;

      switch (periodVolumeAvis) {
        case 'day':
          periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), periodDate.getDate());
          periodEnd = new Date(periodDate.getFullYear(), periodDate.getMonth(), periodDate.getDate(), 23, 59, 59);
          break;
        case 'week':
          periodStart = startOfWeek(periodDate, { locale: fr });
          periodEnd = new Date(periodStart);
          periodEnd.setDate(periodEnd.getDate() + 6);
          periodEnd.setHours(23, 59, 59);
          break;
        case 'month':
          periodStart = startOfMonth(periodDate);
          periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0, 23, 59, 59);
          break;
        case 'year':
          periodStart = startOfYear(periodDate);
          periodEnd = new Date(periodStart.getFullYear() + 1, 0, 0, 23, 59, 59);
          break;
        default:
          periodStart = periodDate;
          periodEnd = periodDate;
      }

      // Filtrer les avis dans cette période
      const reviewsInPeriod = validReviews.filter(r => {
        try {
          const reviewDate = parseISO(r.dateStr);
          return reviewDate >= periodStart && reviewDate <= periodEnd;
        } catch {
          return false;
        }
      });

      const positifs = reviewsInPeriod.filter(r => r.rating >= 4).length;
      const neutres = reviewsInPeriod.filter(r => r.rating === 3).length;
      const negatifs = reviewsInPeriod.filter(r => r.rating <= 2).length;

      return {
        date: period.mois,
        fullDate: period.fullDate,
        positifs,
        neutres,
        negatifs,
        total: positifs + neutres + negatifs
      };
    }).sort((a, b) => a.fullDate.localeCompare(b.fullDate));
    // Note: On inclut TOUTES les dates (même avec total = 0) pour avoir le même axe X que "Évolution Note Moyenne"
  }, [reviews, periodVolumeAvis, i18n.language]);

  // Debug: Afficher les données calculées
  console.log('[HistorySection] processedData:', processedData);
  console.log('[HistorySection] volumeData:', volumeData);

  // Formater les données pour le graphique de note (utiliser label comme date)
  const noteChartData = processedData.map(item => ({
    date: item.label,
    note: item.rating
  }));

  return (
    <>
      {/* Graphique "Évolution Note Moyenne" */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Évolution Note Moyenne</h3>
              <p className="text-sm text-gray-500">Tendance de la satisfaction client</p>
            </div>
          </div>
          <Select value={periodNoteMoyenne} onValueChange={(v) => setPeriodNoteMoyenne(v as Granularity)}>
            <SelectTrigger className="w-32 bg-gray-50 border-gray-200 rounded-lg">
              <SelectValue placeholder={t("analysis.history.period", "Période")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year">{t("analysis.history.byYear", "Par année")}</SelectItem>
              <SelectItem value="month">{t("analysis.history.byMonth", "Par mois")}</SelectItem>
              <SelectItem value="week">{t("analysis.history.byWeek", "Par semaine")}</SelectItem>
              <SelectItem value="day">{t("analysis.history.byDay", "Par jour")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {processedData.length > 0 ? (
          <>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <LineChart data={noteChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    angle={periodNoteMoyenne === 'day' ? -45 : 0}
                    textAnchor={periodNoteMoyenne === 'day' ? 'end' : 'middle'}
                    height={periodNoteMoyenne === 'day' ? 80 : 40}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  >
                    <Label 
                      value="Note" 
                      angle={-90} 
                      position="insideLeft" 
                      style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 14 }}
                    />
                  </YAxis>
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}/5`, t("analysis.history.averageRating", "Note moyenne")]}
                    cursor={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="note" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={{ fill: '#3b82f6', r: 4 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="text-gray-500 text-sm -mt-6 mx-auto text-center block ml-10">Historique - Dates</p>
          </>
        ) : (
          <div className="flex items-center justify-center text-gray-500" style={{ height: '250px' }}>
            <p>{t("analysis.history.noData", "Aucune donnée disponible")}</p>
          </div>
        )}
      </div>

      {/* Graphique "Évolution Volume Avis" */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Évolution Volume Avis</h3>
              <p className="text-sm text-gray-500">Répartition des avis par période</p>
            </div>
          </div>
          <Select value={periodVolumeAvis} onValueChange={(v) => setPeriodVolumeAvis(v as Granularity)}>
            <SelectTrigger className="w-32 bg-gray-50 border-gray-200 rounded-lg">
              <SelectValue placeholder={t("analysis.history.period", "Période")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="year">{t("analysis.history.byYear", "Par année")}</SelectItem>
              <SelectItem value="month">{t("analysis.history.byMonth", "Par mois")}</SelectItem>
              <SelectItem value="week">{t("analysis.history.byWeek", "Par semaine")}</SelectItem>
              <SelectItem value="day">{t("analysis.history.byDay", "Par jour")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {volumeData.length > 0 ? (
          <>
            <div style={{ width: '100%', height: 250 }}>
              <ResponsiveContainer>
                <BarChart data={volumeData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    angle={periodVolumeAvis === 'day' ? -45 : 0}
                    textAnchor={periodVolumeAvis === 'day' ? 'end' : 'middle'}
                    height={periodVolumeAvis === 'day' ? 80 : 40}
                  />
                  <YAxis 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                  >
                    <Label 
                      value="Quantité" 
                      angle={-90} 
                      position="insideLeft" 
                      style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 14 }}
                    />
                  </YAxis>
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const total = payload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold text-gray-900 mb-2">{label}</p>
                            <p className="text-gray-600 mb-2">Total: {total} avis</p>
                            <hr className="my-2 border-gray-200" />
                            {payload.slice().reverse().map((entry: any, index: number) => (
                              <div key={index} className="flex items-center gap-2 py-1">
                                <div 
                                  className="w-3 h-3 rounded-sm" 
                                  style={{ backgroundColor: entry.fill }}
                                />
                                <span className="text-gray-700">{entry.name}: {entry.value} </span>
                                <span className="font-semibold text-gray-900">
                                  ({total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%)
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Bar 
                    dataKey="positifs" 
                    stackId="a" 
                    fill="#22c55e" 
                    name="Positifs"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(data, index, e: any) => {
                      if (e?.target) {
                        e.target.style.filter = 'brightness(1.15)';
                        e.target.style.transform = 'scaleY(1.02)';
                      }
                    }}
                    onMouseLeave={(data, index, e: any) => {
                      if (e?.target) {
                        e.target.style.filter = 'none';
                        e.target.style.transform = 'scaleY(1)';
                      }
                    }}
                  />
                  <Bar 
                    dataKey="neutres" 
                    stackId="a" 
                    fill="#f59e0b" 
                    name="Neutres"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(data, index, e: any) => {
                      if (e?.target) {
                        e.target.style.filter = 'brightness(1.15)';
                        e.target.style.transform = 'scaleY(1.02)';
                      }
                    }}
                    onMouseLeave={(data, index, e: any) => {
                      if (e?.target) {
                        e.target.style.filter = 'none';
                        e.target.style.transform = 'scaleY(1)';
                      }
                    }}
                  />
                  <Bar 
                    dataKey="negatifs" 
                    stackId="a" 
                    fill="#ef4444" 
                    name="Négatifs"
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={(data, index, e: any) => {
                      if (e?.target) {
                        e.target.style.filter = 'brightness(1.15)';
                        e.target.style.transform = 'scaleY(1.02)';
                      }
                    }}
                    onMouseLeave={(data, index, e: any) => {
                      if (e?.target) {
                        e.target.style.filter = 'none';
                        e.target.style.transform = 'scaleY(1)';
                      }
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-gray-500 text-sm -mt-6 mx-auto text-center block ml-10">Historique - Dates</p>
            <div className="flex justify-center gap-6 mt-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Positifs</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-400"></div>
                <span className="text-sm text-gray-600">Neutres</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Négatifs</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center text-gray-500" style={{ height: '250px' }}>
            <p>{t("analysis.history.noData", "Aucune donnée disponible")}</p>
          </div>
        )}
      </div>
    </>
  );
}
