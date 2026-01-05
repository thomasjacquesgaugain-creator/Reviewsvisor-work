/**
 * Formate la date d'un avis au format français
 * Utilise published_at en priorité, puis create_time, puis inserted_at comme fallback
 */
export function formatReviewDate(review: {
  published_at?: string | null;
  create_time?: string | null;
  inserted_at?: string | null;
}): string | null {
  // Essayer published_at en premier
  if (review.published_at) {
    try {
      const date = new Date(review.published_at);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (e) {
      // Date invalide, continuer avec les fallbacks
    }
  }

  // Fallback vers create_time
  if (review.create_time) {
    try {
      const date = new Date(review.create_time);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (e) {
      // Date invalide, continuer avec le dernier fallback
    }
  }

  // Dernier fallback vers inserted_at
  if (review.inserted_at) {
    try {
      const date = new Date(review.inserted_at);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (e) {
      // Date invalide
    }
  }

  return null;
}

