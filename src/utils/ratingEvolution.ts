import { format, eachMonthOfInterval, eachWeekOfInterval, eachDayOfInterval, endOfMonth, endOfWeek, endOfDay, endOfYear, eachYearOfInterval, isBefore, parseISO, Locale } from 'date-fns';
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
 * Calcule l'évolution de la note moyenne à partir du premier avis disponible
 * @param reviews - Tous les avis de l'établissement
 * @param registrationDate - Date d'enregistrement de l'établissement (utilisée en repli si aucun avis valide)
 * @param granularity - Granularité de l'agrégation (jour, semaine, mois, année)
 * @returns Série temporelle avec la note moyenne par période
 */
export function getRatingEvolution(
  reviews: Review[],
  registrationDate: string | Date,
  granularity: Granularity = 'mois',
  language: string = 'fr'
): RatingDataPoint[] {
  const today = new Date();
  const registration =
    typeof registrationDate === 'string'
      ? parseISO(registrationDate)
      : registrationDate;
  
  // Filtrer les avis valides (avec note et date)
  const validReviews = reviews.filter(
    r => r.rating !== null && r.rating !== undefined && (r.published_at || r.inserted_at)
  );
  
  // Obtenir la locale appropriée
  const locale = localeMap[language] || fr;
  
  // Si aucun avis, retourner une courbe plate à 0
  if (validReviews.length === 0) {
    const fallbackStartDate =
      !isNaN(registration.getTime()) && registration.getTime() <= today.getTime()
        ? registration
        : today;
    const periods = getPeriods(fallbackStartDate, today, granularity);
    return periods.map(period => ({
      mois: formatPeriodLabel(period, granularity, locale),
      note: 0,
      fullDate: format(period, 'yyyy-MM-dd'),
    }));
  }
  
  // Trier les avis par date et ignorer les dates invalides
  const sortedReviews = validReviews
    .map(r => ({
      ...r,
      date: parseISO(r.published_at || r.inserted_at || ''),
    }))
    .filter((review): review is Review & { date: Date } => !isNaN(review.date.getTime()))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sortedReviews.length === 0) {
    const fallbackStartDate =
      !isNaN(registration.getTime()) && registration.getTime() <= today.getTime()
        ? registration
        : today;
    const periods = getPeriods(fallbackStartDate, today, granularity);
    return periods.map(period => ({
      mois: formatPeriodLabel(period, granularity, locale),
      note: 0,
      fullDate: format(period, 'yyyy-MM-dd'),
    }));
  }

  // Utiliser tout l'historique disponible des avis, pas la date d'ajout en base
  const startDate = sortedReviews[0].date;

  if (startDate.getTime() > today.getTime()) {
    const periods = getPeriods(today, today, granularity);
    return periods.map(period => ({
      mois: formatPeriodLabel(period, granularity, locale),
      note: 0,
      fullDate: format(period, 'yyyy-MM-dd'),
    }));
  }
  
  // Générer toutes les périodes entre le premier avis disponible et aujourd'hui
  const periods = getPeriods(startDate, today, granularity);
  
  // Pour chaque période, calculer la moyenne des avis jusqu'à ce point
  const dataPoints: RatingDataPoint[] = periods.map(period => {
    const periodEnd = getPeriodEnd(period, granularity);
    
    // Filtrer tous les avis publiés avant ou pendant cette période
    const reviewsUpToMonth = sortedReviews.filter(r => {
      return isBefore(r.date, periodEnd) || r.date.getTime() === periodEnd.getTime();
    });
    
    // Calculer la moyenne
    let avgRating = 0;
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
 * Formate le label de la période pour l'axe X
 * RÈGLE : Année affichée UNIQUEMENT pour mois, JAMAIS pour jour et semaine
 */
function formatPeriodLabel(date: Date, granularity: Granularity, locale: Locale = fr): string {
  switch (granularity) {
    case 'jour':
      // Format: "12/04" (JJ/MM) - SANS année
      return format(date, 'dd/MM', { locale });
    case 'semaine':
      // Format: "S14" (semaine 14) - SANS année pour simplifier l'axe X
      const weekNum = format(date, 'w', { locale });
      return `S${weekNum}`;
    case 'année':
      return format(date, 'yyyy', { locale });
    case 'mois':
    default:
      // Format: "avril 2025" - AVEC année (utile et lisible)
      return format(date, 'MMMM yyyy', { locale });
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
