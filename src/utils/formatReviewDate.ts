/**
 * Formate la date d'un avis au format français
 * Vérifie tous les champs de date possibles dans l'ordre de priorité
 */
export function formatReviewDate(review: any): string | null {
  // Debug: Log available date fields
  const dateFields = {
    published_at: review.published_at,
    create_time: review.create_time,
    review_date: review.review_date,
    date: review.date,
    createdAt: review.createdAt,
    reviewDate: review.reviewDate,
    publishedAt: review.publishedAt,
    inserted_at: review.inserted_at
  };
  
  // Priorité 1 : published_at (date de publication réelle depuis l'API)
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
      console.warn('Invalid published_at date:', review.published_at, e);
    }
  }

  // Priorité 2 : create_time (date de création de l'avis depuis l'API)
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
      console.warn('Invalid create_time date:', review.create_time, e);
    }
  }

  // Priorité 3 : createTime directement (champ source depuis JSON)
  if (review.createTime) {
    try {
      const date = new Date(review.createTime);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch (e) {
      console.warn('Invalid createTime date:', review.createTime, e);
    }
  }

  // Priorité 4 : Autres champs possibles
  const alternativeFields = ['review_date', 'date', 'createdAt', 'reviewDate', 'publishedAt'];
  for (const field of alternativeFields) {
    if (review[field]) {
      try {
        const date = new Date(review[field]);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {
        // Continue to next field
      }
    }
  }

  // Priorité 5 : Vérifier dans raw si disponible
  if (review.raw && typeof review.raw === 'object') {
    if (review.raw.createTime) {
      try {
        const date = new Date(review.raw.createTime);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {
        // Continue
      }
    }
    if (review.raw.publishedAtDate) {
      try {
        const date = new Date(review.raw.publishedAtDate);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        }
      } catch (e) {
        // Continue
      }
    }
  }

  // Si aucune date n'est trouvée, log pour debug
  if (Object.values(dateFields).every(v => !v)) {
    console.warn('⚠️ No date field found in review:', {
      id: review.id,
      availableFields: Object.keys(review).filter(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'))
    });
  }

  return null;
}



