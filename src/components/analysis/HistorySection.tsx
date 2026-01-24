import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Label, ComposedChart } from "recharts";
import { TimeSeriesDataPoint, Review } from "@/types/analysis";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import {
  differenceInCalendarDays,
  endOfDay,
  endOfWeek,
  format,
  getWeek,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  startOfYear,
  subDays,
  subMonths,
  subWeeks,
  subYears,
} from "date-fns";
import { fr } from "date-fns/locale";
import { getRatingEvolution, Granularity as RatingGranularity } from "@/utils/ratingEvolution";
import { TrendingUp, BarChart3, Filter } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAnalysisFilters } from "./AnalysisFiltersContext";
import { parseReviewDate, computeRange } from "@/utils/filterReviews";

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
  const { periodFilter } = useAnalysisFilters();
  // États séparés pour chaque graphique
  const [periodNoteMoyenne, setPeriodNoteMoyenne] = useState<Granularity>('month');
  const [periodVolumeAvis, setPeriodVolumeAvis] = useState<Granularity>('month');
  const [hasUserChosenVolumeGranularity, setHasUserChosenVolumeGranularity] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  
  // État pour gérer les filtres de courbes
  const [curveFilters, setCurveFilters] = useState<{
    total: boolean;
    positifs: boolean;
    neutres: boolean;
    negatifs: boolean;
  }>({
    total: false,
    positifs: false,
    neutres: false,
    negatifs: false,
  });

  // Fonction pour toggle un filtre
  const toggleCurveFilter = (filterName: keyof typeof curveFilters) => {
    setCurveFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  // Granularité auto pour "Évolution Volume Avis" selon la période d'analyse
  const analysisRange = useMemo(() => {
    const { start, end } = computeRange(
      periodFilter.preset as any,
      (periodFilter as any).startDate ?? null,
      (periodFilter as any).endDate ?? null
    );

    if (start && end) return { start, end };

    // fallback: déduire depuis les reviews reçues (déjà filtrées)
    const dates = (reviews || [])
      .map((r) =>
        parseReviewDate(
          (r as any).date ||
            (r as any).published_at ||
            (r as any).inserted_at ||
            (r as any).created_at
        )
      )
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) return { start: null, end: null };
    return { start: startOfDay(dates[0]), end: endOfDay(dates[dates.length - 1]) };
  }, [periodFilter, reviews]);

  const autoVolumeGranularity: Granularity = useMemo(() => {
    if (!analysisRange.start || !analysisRange.end) return "month";
    const days = differenceInCalendarDays(analysisRange.end, analysisRange.start) + 1;
    if (days <= 30) return "day";
    if (days <= 120) return "week";
    return "month";
  }, [analysisRange.end, analysisRange.start]);

  useEffect(() => {
    // Auto uniquement tant que l'utilisateur n'a pas choisi explicitement une granularité.
    if (!hasUserChosenVolumeGranularity) {
      setPeriodVolumeAvis(autoVolumeGranularity);
    }
  }, [autoVolumeGranularity, hasUserChosenVolumeGranularity]);

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
            // Format: "12/04" (JJ/MM) - SANS année
            label = format(date, 'dd/MM', { locale: fr });
            break;
          case 'week':
            const weekStart = startOfWeek(date, { locale: fr });
            key = format(weekStart, 'yyyy-MM-dd');
            const weekNum = getWeek(date, { locale: fr });
            // Format: "S14" - SANS année pour simplifier l'axe X
            label = `S${weekNum}`;
            break;
          case 'month':
            const monthStart = startOfMonth(date);
            key = format(monthStart, 'yyyy-MM');
            // Format: "avr. 2025" - AVEC année (utile et lisible)
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
              // Format: "12/04" (JJ/MM) - SANS année
              label = format(date, 'dd/MM', { locale: fr });
              break;
            case 'week':
              // Format: "S14" - SANS année pour simplifier l'axe X
              const weekNum = getWeek(date, { locale: fr });
              label = `S${weekNum}`;
              break;
            case 'month':
              // Format: "janv. 2025" - AVEC année
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

  // Données Volume d'avis : buckets adaptés (jour / semaine ISO / mois)
  const volumeChartData = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];

    const rangeStart = analysisRange.start ? startOfDay(analysisRange.start) : null;
    const rangeEnd = analysisRange.end ? endOfDay(analysisRange.end) : null;

    type Bucket = {
      key: string;
      sortDate: Date;
      label: string;
      tooltipLabel: string;
      positifs: number;
      neutres: number;
      negatifs: number;
      total: number;
    };

    const buckets = new Map<string, Bucket>();

    for (const r of reviews) {
      const note = (r.note ?? (r as any).rating ?? 0) as number;
      if (!(note >= 1 && note <= 5)) continue;

      const rawDate =
        (r as any).date ||
        (r as any).published_at ||
        (r as any).inserted_at ||
        (r as any).created_at;
      const d = parseReviewDate(rawDate);
      if (!d) continue;

      if (rangeStart && d.getTime() < rangeStart.getTime()) continue;
      if (rangeEnd && d.getTime() > rangeEnd.getTime()) continue;

      let sortDate: Date;
      let key: string;
      let label: string;
      let tooltipLabel: string;

      if (periodVolumeAvis === "day") {
        sortDate = startOfDay(d);
        key = format(sortDate, "yyyy-MM-dd");
        label = format(sortDate, "d MMM", { locale: fr });
        tooltipLabel = format(sortDate, "d MMM yyyy", { locale: fr });
      } else if (periodVolumeAvis === "week") {
        sortDate = startOfWeek(d, { weekStartsOn: 1 });
        const isoWeek = getISOWeek(sortDate);
        const isoYear = getISOWeekYear(sortDate);
        key = `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;
        label = `Sem. ${isoWeek}`;
        const weekEnd = endOfWeek(sortDate, { weekStartsOn: 1 });
        tooltipLabel = `Sem. ${isoWeek} (${format(sortDate, "dd", { locale: fr })}–${format(weekEnd, "dd MMM", { locale: fr })})`;
      } else {
        // month (default)
        sortDate = startOfMonth(d);
        key = format(sortDate, "yyyy-MM");
        label = format(sortDate, "MMM yyyy", { locale: fr });
        tooltipLabel = format(sortDate, "MMMM yyyy", { locale: fr });
      }

      const existing = buckets.get(key) || {
        key,
        sortDate,
        label,
        tooltipLabel,
        positifs: 0,
        neutres: 0,
        negatifs: 0,
        total: 0,
      };

      if (note >= 4) existing.positifs += 1;
      else if (note === 3) existing.neutres += 1;
      else existing.negatifs += 1;

      existing.total = existing.positifs + existing.neutres + existing.negatifs;
      buckets.set(key, existing);
    }

    const arr = Array.from(buckets.values())
      .filter((b) => b.total > 0)
      .sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());

    // Limiter à une plage lisible (max 14 barres) : on garde les plus récentes
    const MAX_BARS = 14;
    return arr.length > MAX_BARS ? arr.slice(-MAX_BARS) : arr;
  }, [analysisRange.end, analysisRange.start, periodVolumeAvis, reviews]);

  // Formater les données pour le graphique de note
  // Utiliser fullDate (date réelle) comme clé pour garantir la continuité de l'axe X
  // Le label sera formaté via tickFormatter
  const noteChartData = useMemo(() => {
    return processedData.map(item => {
      // Parser la date pour obtenir un timestamp
      let dateValue: number;
      try {
        const date = parseISO(item.date);
        dateValue = date.getTime();
      } catch {
        dateValue = 0;
      }
      
      return {
        date: item.label, // Label formaté pour l'affichage
        dateValue, // Timestamp pour la continuité de l'axe
        fullDate: item.date, // Date ISO pour référence
        note: item.rating
      };
    });
  }, [processedData]);

  // Tooltip custom pour "Évolution Note Moyenne"
  const renderNoteTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    // label est maintenant un timestamp, trouver le dataPoint correspondant
    const dataPoint = noteChartData.find(d => d.dateValue === label);
    let periodLabel = dataPoint?.date || '';
    const value = payload[0]?.value as number | undefined;
    
    // Enrichir le tooltip pour les semaines avec la plage de dates (sans année pour alléger)
    if (periodNoteMoyenne === 'week' && dataPoint) {
      try {
        const periodDate = parseISO(dataPoint.fullDate);
        if (!isNaN(periodDate.getTime())) {
          const weekStart = startOfWeek(periodDate, { locale: fr });
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          // Format: "S14 (16–22 déc.)" - plage de dates sans année
          periodLabel = `${periodLabel} (${format(weekStart, 'dd', { locale: fr })}–${format(weekEnd, 'dd MMM', { locale: fr })})`;
        }
      } catch {
        // Si erreur, garder le label simple
      }
    }
    
    // Compter le volume correspondant à la granularité de la courbe de note
    const totalCount = (() => {
      if (!dataPoint || !reviews || reviews.length === 0) return undefined;

      const anchor = parseReviewDate(dataPoint.fullDate);
      if (!anchor) return undefined;

      let periodStart: Date;
      let periodEnd: Date;

      switch (periodNoteMoyenne) {
        case "day":
          periodStart = startOfDay(anchor);
          periodEnd = endOfDay(anchor);
          break;
        case "week":
          periodStart = startOfWeek(anchor, { weekStartsOn: 1 });
          periodEnd = endOfWeek(periodStart, { weekStartsOn: 1 });
          break;
        case "month":
          periodStart = startOfMonth(anchor);
          periodEnd = endOfDay(new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0));
          break;
        case "year":
          periodStart = startOfYear(anchor);
          periodEnd = endOfDay(new Date(periodStart.getFullYear(), 11, 31));
          break;
        default:
          periodStart = startOfDay(anchor);
          periodEnd = endOfDay(anchor);
      }

      let count = 0;
      for (const r of reviews) {
        const raw =
          (r as any).date ||
          (r as any).published_at ||
          (r as any).inserted_at ||
          (r as any).created_at;
        const d = parseReviewDate(raw);
        if (!d) continue;
        if (d.getTime() >= periodStart.getTime() && d.getTime() <= periodEnd.getTime()) {
          count += 1;
        }
      }
      return count;
    })();

    const hasNoData = totalCount === 0 || totalCount === undefined;
    const isLowData = totalCount !== undefined && totalCount > 0 && totalCount < 3;

    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-900 mb-1">{periodLabel}</p>
        {hasNoData ? (
          <p className="text-xs text-gray-500">Aucun avis sur cette période</p>
        ) : (
          <>
            <p className="text-sm text-gray-700">
              Note moyenne :{" "}
              <span className="font-semibold text-gray-900">
                {typeof value === "number" ? value.toFixed(2) : "-"} / 5
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Basée sur {totalCount} avis
            </p>
            {isLowData && (
              <p className="mt-1 text-[11px] text-amber-600">
                Tendance basée sur peu d'avis
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  // Marges pour les graphiques
  // Graphique Note : marge gauche standard
  const noteChartMargin = { top: 20, right: 20, left: 50, bottom: 40 };
  // Graphique Volume : marge gauche augmentée pour réserver l'espace aux axes (Y + labels)
  // L'axe Y ne doit jamais traverser les barres
  const volumeChartMargin = { top: 20, right: 20, left: 80, bottom: 40 };
  const chartHeight = 400; // Augmenté de 250 à 400px (+60%) pour améliorer la lisibilité

  // Propriétés XAxis identiques
  const xAxisAngle = periodNoteMoyenne === 'day' || periodVolumeAvis === 'day' ? -45 : 0;
  const xAxisTextAnchor = periodNoteMoyenne === 'day' || periodVolumeAvis === 'day' ? 'end' : 'middle';
  const xAxisHeight = periodNoteMoyenne === 'day' || periodVolumeAvis === 'day' ? 80 : 40;

  const volumeBarLayout = useMemo(() => {
    const n = volumeChartData.length;
    if (n <= 3) return { barSize: 22, barCategoryGap: "28%", barGap: 8 };
    if (n <= 6) return { barSize: 20, barCategoryGap: "20%", barGap: 6 };
    if (n <= 10) return { barSize: 18, barCategoryGap: "14%", barGap: 4 };
    return { barSize: 16, barCategoryGap: "10%", barGap: 3 };
  }, [volumeChartData.length]);

  return (
    <div className="w-full max-w-full">
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
            <div style={{ width: '100%', height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={noteChartData}
                  margin={noteChartMargin}
                  onClick={(state: any) => {
                    if (state?.activeLabel) {
                      setSelectedPeriod(state.activeLabel as string);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="dateValue"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    angle={xAxisAngle}
                    textAnchor={xAxisTextAnchor}
                    height={xAxisHeight}
                    interval="preserveStartEnd"
                    tickFormatter={(value) => {
                      // Trouver le label correspondant à cette valeur timestamp
                      const dataPoint = noteChartData.find(d => d.dateValue === value);
                      return dataPoint?.date || '';
                    }}
                  />
                  <YAxis 
                    domain={[1, 5]} 
                    ticks={[1, 2, 3, 4, 5]} 
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    width={40}
                  >
                    <Label 
                      value="Note" 
                      angle={-90} 
                      position="insideLeft" 
                      style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 14 }}
                    />
                  </YAxis>
                  <Tooltip
                    content={renderNoteTooltip}
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
            <div className="pl-[50px] flex justify-center" style={{ marginTop: '4px' }}>
              <p className="text-gray-500 text-sm text-center">Historique - Dates</p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center text-gray-500" style={{ height: chartHeight }}>
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
          <div className="flex items-center gap-2">
            {/* Bouton Filtres */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-32 bg-gray-50 border-gray-200 rounded-lg hover:bg-gray-100"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filtres
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-4" align="end">
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Courbes de tendance</p>
                  
                  {/* Toggle Volume total */}
                  <button
                    onClick={() => toggleCurveFilter('total')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      curveFilters.total 
                        ? 'bg-blue-50 border-2 border-blue-500' 
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-medium text-gray-700">Volume total</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                      curveFilters.total 
                        ? 'bg-blue-500 border-blue-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {curveFilters.total && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Toggle Avis positifs */}
                  <button
                    onClick={() => toggleCurveFilter('positifs')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      curveFilters.positifs 
                        ? 'bg-green-50 border-2 border-green-500' 
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-gray-700">Avis positifs</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                      curveFilters.positifs 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {curveFilters.positifs && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Toggle Avis neutres */}
                  <button
                    onClick={() => toggleCurveFilter('neutres')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      curveFilters.neutres 
                        ? 'bg-orange-50 border-2 border-orange-500' 
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      <span className="text-sm font-medium text-gray-700">Avis neutres</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                      curveFilters.neutres 
                        ? 'bg-orange-500 border-orange-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {curveFilters.neutres && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Toggle Avis négatifs */}
                  <button
                    onClick={() => toggleCurveFilter('negatifs')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                      curveFilters.negatifs 
                        ? 'bg-red-50 border-2 border-red-500' 
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm font-medium text-gray-700">Avis négatifs</span>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 transition-all ${
                      curveFilters.negatifs 
                        ? 'bg-red-500 border-red-500' 
                        : 'bg-white border-gray-300'
                    }`}>
                      {curveFilters.negatifs && (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            <Select
              value={periodVolumeAvis}
              onValueChange={(v) => {
                setPeriodVolumeAvis(v as Granularity);
                setHasUserChosenVolumeGranularity(true);
              }}
            >
              <SelectTrigger className="w-32 bg-gray-50 border-gray-200 rounded-lg">
                <SelectValue placeholder={t("analysis.history.period", "Période")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">{t("analysis.history.byMonth", "Par mois")}</SelectItem>
                <SelectItem value="week">{t("analysis.history.byWeek", "Par semaine")}</SelectItem>
                <SelectItem value="day">{t("analysis.history.byDay", "Par jour")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {volumeChartData.length > 0 ? (
          <>
            <div style={{ width: '100%', height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={volumeChartData}
                  margin={volumeChartMargin}
                  barCategoryGap={volumeBarLayout.barCategoryGap}
                  barGap={volumeBarLayout.barGap}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label"
                    tick={{ fill: '#6b7280', fontSize: 12 }} 
                    angle={xAxisAngle}
                    textAnchor={xAxisTextAnchor}
                    height={xAxisHeight}
                    interval="preserveStartEnd"
                  />
                  <YAxis 
                    orientation="left"
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    width={50}
                    domain={[0, 'dataMax']}
                    axisLine={false}
                  >
                    <Label 
                      value="Quantité" 
                      angle={-90} 
                      position="insideLeft" 
                      offset={-5}
                      style={{ textAnchor: 'middle', fill: '#6b7280', fontSize: 14 }}
                    />
                  </YAxis>
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload || payload.length === 0) {
                        return null;
                      }

                      const barData = payload.filter((item: any) => {
                        if (item.type === 'line') return false;
                        return ['positifs', 'neutres', 'negatifs'].includes(item.dataKey) && 
                               item.fill && 
                               item.value !== undefined;
                      });

                      const uniqueBars = new Map();
                      barData.forEach((item: any) => {
                        if (!uniqueBars.has(item.dataKey)) {
                          uniqueBars.set(item.dataKey, item);
                        }
                      });
                      const barPayload = Array.from(uniqueBars.values());

                      const total = barPayload.reduce((sum: number, p: any) => sum + (p.value || 0), 0);
                      const hasNoData = total === 0;
                      const isLowData = total > 0 && total < 3;

                      const displayLabel =
                        (payload?.[0] as any)?.payload?.tooltipLabel ||
                        (payload?.[0] as any)?.payload?.label ||
                        (label as string) ||
                        '';
                      
                      if (hasNoData) {
                        return (
                          <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                            <p className="font-semibold text-gray-900 mb-1">{displayLabel}</p>
                            <p className="text-xs text-gray-500">Aucun avis sur cette période</p>
                          </div>
                        );
                      }

                      if (barPayload.length === 0) {
                        return null;
                      }

                      const sortedBars = barPayload.sort((a: any, b: any) => {
                        const order: { [key: string]: number } = { negatifs: 0, neutres: 1, positifs: 2 };
                        return (order[a.dataKey] || 0) - (order[b.dataKey] || 0);
                      });

                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                          <p className="font-semibold text-gray-900 mb-1">{displayLabel}</p>
                          <p className="text-gray-600 mb-1">Total: {total} avis</p>
                          {isLowData && (
                            <p className="text-[11px] text-amber-600 mb-1">
                              Tendance basée sur peu d’avis
                            </p>
                          )}
                          <hr className="my-2 border-gray-200" />
                          
                          {sortedBars.map((entry: any) => {
                            const displayName = entry.dataKey === 'negatifs' ? 'Avis négatifs' :
                                              entry.dataKey === 'neutres' ? 'Avis neutres' :
                                              entry.dataKey === 'positifs' ? 'Avis positifs' : entry.name;
                            
                            return (
                              <div key={`bar-${entry.dataKey}`} className="flex items-center gap-2 py-1">
                                <div 
                                  className="w-3 h-3 rounded-sm" 
                                  style={{ backgroundColor: entry.fill }}
                                />
                                <span className="text-gray-700">{displayName}: {entry.value} </span>
                                <span className="font-semibold text-gray-900">
                                  ({total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0}%)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }}
                    cursor={{ fill: 'transparent' }}
                  />
                  
                  {/* Barres empilées */}
                  <Bar 
                    dataKey="positifs" 
                    stackId="a" 
                    fill="#22c55e" 
                    name="Positifs"
                    barSize={volumeBarLayout.barSize}
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
                    barSize={volumeBarLayout.barSize}
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
                    barSize={volumeBarLayout.barSize}
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

                  {/* Courbes de tendance conditionnelles */}
                  {curveFilters.total && (
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#3B82F6" }}
                      activeDot={{ r: 6 }}
                      name="Volume total"
                      connectNulls={false}
                    />
                  )}
                  {curveFilters.positifs && (
                    <Line
                      type="monotone"
                      dataKey="positifs"
                      stroke="#22C55E"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#22C55E" }}
                      activeDot={{ r: 6 }}
                      name="Avis positifs"
                      connectNulls={false}
                    />
                  )}
                  {curveFilters.neutres && (
                    <Line
                      type="monotone"
                      dataKey="neutres"
                      stroke="#F59E0B"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#F59E0B" }}
                      activeDot={{ r: 6 }}
                      name="Avis neutres"
                      connectNulls={false}
                    />
                  )}
                  {curveFilters.negatifs && (
                    <Line
                      type="monotone"
                      dataKey="negatifs"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ r: 4, fill: "#EF4444" }}
                      activeDot={{ r: 6 }}
                      name="Avis négatifs"
                      connectNulls={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="pl-[50px] flex justify-center" style={{ marginTop: '4px' }}>
              <p className="text-gray-500 text-sm text-center">Historique - Dates</p>
            </div>
            
            {/* Légende des barres */}
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

            {/* Légende dynamique des courbes */}
            {(curveFilters.total || curveFilters.positifs || curveFilters.neutres || curveFilters.negatifs) && (
              <div className="flex justify-center gap-6 mt-3 pt-3 border-t border-gray-200">
                {curveFilters.total && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">Volume total</span>
                  </div>
                )}
                {curveFilters.positifs && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm text-gray-600">Avis positifs</span>
                  </div>
                )}
                {curveFilters.neutres && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-sm text-gray-600">Avis neutres</span>
                  </div>
                )}
                {curveFilters.negatifs && (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-sm text-gray-600">Avis négatifs</span>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center text-gray-500" style={{ height: chartHeight }}>
            <p>{t("analysis.history.noData", "Aucune donnée disponible")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
