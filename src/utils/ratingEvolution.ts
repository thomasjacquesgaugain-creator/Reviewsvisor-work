import { format, eachMonthOfInterval, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

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
 * @returns Série temporelle avec la note moyenne par mois
 */
export function getRatingEvolution(
  reviews: Review[],
  registrationDate: string | Date
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
  
  // Si aucun avis, retourner une courbe plate à 0
  if (validReviews.length === 0) {
    const months = eachMonthOfInterval({ start: startDate, end: today });
    return months.map(month => ({
      mois: format(month, 'MMM', { locale: fr }),
      note: 0,
      fullDate: format(month, 'yyyy-MM-dd'),
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
  
  // Générer tous les mois entre la date d'enregistrement et aujourd'hui
  const months = eachMonthOfInterval({ start: startDate, end: today });
  
  // Pour chaque mois, calculer la moyenne des avis jusqu'à ce point
  const dataPoints: RatingDataPoint[] = months.map(month => {
    const monthEnd = endOfMonth(month);
    
    // Filtrer tous les avis publiés avant ou pendant ce mois
    const reviewsUpToMonth = sortedReviews.filter(r => {
      return isBefore(r.date, monthEnd) || r.date.getTime() === monthEnd.getTime();
    });
    
    // Calculer la moyenne
    let avgRating = initialRating;
    if (reviewsUpToMonth.length > 0) {
      const sum = reviewsUpToMonth.reduce((acc, r) => acc + (r.rating || 0), 0);
      avgRating = sum / reviewsUpToMonth.length;
    }
    
    return {
      mois: format(month, 'MMM', { locale: fr }),
      note: Number(avgRating.toFixed(2)),
      fullDate: format(month, 'yyyy-MM-dd'),
    };
  });
  
  return dataPoints;
}

/**
 * Formate une date pour l'affichage
 */
export function formatRegistrationDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: fr });
}
