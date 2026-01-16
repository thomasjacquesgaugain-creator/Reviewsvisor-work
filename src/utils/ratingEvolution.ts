import { format, eachMonthOfInterval, eachWeekOfInterval, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, startOfYear, endOfYear, eachYearOfInterval, isAfter, isBefore, parseISO, Locale } from 'date-fns';
import { fr, enUS, it, es, ptBR } from 'date-fns/locale';

export type Granularity = 'jour' | 'semaine' | 'mois' | 'année';

// Map i18n language codes to date-fns locales
const localeMap: Record<string, Locale> = {
  'fr': fr,
  'en': enUS,
  'it': it,
  'es': es,
  'pt': ptBR,
};

interface Review {
  rating: number | null;
  published_at: string | null;
  inserted_at?: string | null;
}

interface RatingDataPoint {
  mois: string;
  note: number;
  fullDate: string;
}

/**
 * Calcule l'évolution de la note moyenne depuis la date d'enregistrement
 * @param reviews - Tous les avis de l'établissement
 * @param registrationDate - Date d'enregistrement de l'établissement
 * @param granularity - Granularité de l'agrégation (jour, semaine, mois, année)
 * @returns Série temporelle avec la note moyenne par période
 */
export function getRatingEvolution(
  reviews: Review[],
  registrationDate: string | Date,
  granularity: Granularity = 'mois',
  language: string = 'fr'
): RatingDataPoint[] {
  // Convertir la date d'enregistrement en objet Date
  const startDate = typeof registrationDate === 'string' 
    ? parseISO(registrationDate) 
    : registrationDate;
  
  const today = new Date();
  
  // Filtrer les avis valides (avec note et date)
  const validReviews = reviews.filter(
    r => r.rating !== null && r.rating !== undefined && (r.published_at || r.inserted_at)
  );
  
  // Obtenir la locale appropriée
  const locale = localeMap[language] || fr;
  
  // Si aucun avis, retourner une courbe plate à 0
  if (validReviews.length === 0) {
    const periods = getPeriods(startDate, today, granularity);
    return periods.map(period => ({
      mois: formatPeriodLabel(period, granularity, locale),
      note: 0,
      fullDate: format(period, 'yyyy-MM-dd'),
    }));
  }
  
  // Trier les avis par date
  const sortedReviews = validReviews
    .map(r => ({
      ...r,
      date: parseISO(r.published_at || r.inserted_at || ''),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculer la note moyenne initiale (baseline)
  const initialRating = sortedReviews.length > 0
    ? sortedReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / sortedReviews.length
    : 0;
  
  // Générer toutes les périodes entre la date d'enregistrement et aujourd'hui
  const periods = getPeriods(startDate, today, granularity);
  
  // Pour chaque période, calculer la moyenne des avis jusqu'à ce point
  const dataPoints: RatingDataPoint[] = periods.map(period => {
    const periodEnd = getPeriodEnd(period, granularity);
    
    // Filtrer tous les avis publiés avant ou pendant cette période
    const reviewsUpToMonth = sortedReviews.filter(r => {
      return isBefore(r.date, periodEnd) || r.date.getTime() === periodEnd.getTime();
    });
    
    // Calculer la moyenne
    let avgRating = initialRating;
    if (reviewsUpToMonth.length > 0) {
      const sum = reviewsUpToMonth.reduce((acc, r) => acc + (r.rating || 0), 0);
      avgRating = sum / reviewsUpToMonth.length;
    }
    
    return {
      mois: formatPeriodLabel(period, granularity, locale),
      note: Number(avgRating.toFixed(2)),
      fullDate: format(period, 'yyyy-MM-dd'),
    };
  });
  
  return dataPoints;
}

/**
 * Génère les périodes selon la granularité
 */
function getPeriods(start: Date, end: Date, granularity: Granularity): Date[] {
  switch (granularity) {
    case 'jour':
      return eachDayOfInterval({ start, end });
    case 'semaine':
      return eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
    case 'année':
      return eachYearOfInterval({ start, end });
    case 'mois':
    default:
      return eachMonthOfInterval({ start, end });
  }
}

/**
 * Obtient la fin de la période
 */
function getPeriodEnd(date: Date, granularity: Granularity): Date {
  switch (granularity) {
    case 'jour':
      return endOfDay(date);
    case 'semaine':
      return endOfWeek(date, { weekStartsOn: 1 });
    case 'année':
      return endOfYear(date);
    case 'mois':
    default:
      return endOfMonth(date);
  }
}

/**
 * Formate le label de la période
 */
function formatPeriodLabel(date: Date, granularity: Granularity, locale: Locale = fr): string {
  switch (granularity) {
    case 'jour':
      return format(date, 'dd MMM', { locale });
    case 'semaine':
      return format(date, "'S'w", { locale });
    case 'année':
      return format(date, 'yyyy', { locale });
    case 'mois':
    default:
      return format(date, 'MMM', { locale });
  }
}

/**
 * Formate une date pour l'affichage
 */
export function formatRegistrationDate(date: string | Date, language: string = 'fr'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const locale = localeMap[language] || fr;
  return format(d, 'dd/MM/yyyy', { locale });
}
