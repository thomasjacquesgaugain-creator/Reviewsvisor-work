/**
 * Gestion de la baseline (note de référence) pour chaque établissement
 */

interface BaselineData {
  score: number;
  date: string;
}

interface BaselineSatisfactionData {
  percentage: number;
  date: string;
}

const BASELINE_PREFIX = 'baselineScore::';
const BASELINE_SATISFACTION_PREFIX = 'baselineSatisfaction::';

// Mots-clés pour la détection de sentiment
const POSITIVE_KEYWORDS = [
  'très bon', 'excellent', 'top', 'impeccable', 'rapide', 'accueillant',
  'sympa', 'je recommande', 'super', 'génial', 'parfait', 'délicieux',
  'formidable', 'extraordinaire', 'magnifique', 'incroyable', 'merveilleux'
];

const NEGATIVE_KEYWORDS = [
  'décevant', 'mauvais', 'lent', 'pas bon', 'froid', 'cher pour ce que',
  'horrible', 'médiocre', 'nul', 'catastrophe', 'déçu', 'inadmissible'
];

/**
 * Détermine si un avis est positif
 */
function isPositiveReview(review: any): boolean {
  // Basé sur la note
  if (review.rating >= 4) return true;
  
  // Basé sur le texte si disponible
  if (review.text) {
    const text = review.text.toLowerCase();
    if (POSITIVE_KEYWORDS.some(keyword => text.includes(keyword))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Détermine si un avis est négatif
 */
function isNegativeReview(review: any): boolean {
  // Basé sur la note
  if (review.rating <= 2) return true;
  
  // Basé sur le texte si disponible
  if (review.text) {
    const text = review.text.toLowerCase();
    if (NEGATIVE_KEYWORDS.some(keyword => text.includes(keyword))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calcule le pourcentage de satisfaction à partir des avis
 */
export function computeSatisfactionPct(reviews: any[]): number {
  if (!reviews || reviews.length === 0) return 0;
  
  let positiveCount = 0;
  let totalCount = 0;
  
  reviews.forEach(review => {
    // Ignorer les avis neutres sans contenu clair
    if (review.rating === 3 && !review.text) {
      return;
    }
    
    totalCount++;
    
    if (isPositiveReview(review)) {
      positiveCount++;
    }
  });
  
  if (totalCount === 0) return 0;
  
  return Math.round((positiveCount / totalCount) * 100);
}

/**
 * Récupère ou initialise la baseline de satisfaction pour un établissement
 */
export function ensureBaselineSatisfaction(
  establishmentId: string,
  currentSatisfactionPct: number
): BaselineSatisfactionData {
  const key = `${BASELINE_SATISFACTION_PREFIX}${establishmentId}`;
  
  try {
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const baseline: BaselineSatisfactionData = JSON.parse(stored);
      return baseline;
    }
    
    // Pas de baseline → initialiser avec le taux actuel
    const newBaseline: BaselineSatisfactionData = {
      percentage: currentSatisfactionPct,
      date: new Date().toISOString(),
    };
    
    localStorage.setItem(key, JSON.stringify(newBaseline));
    return newBaseline;
  } catch (error) {
    console.error('Error managing baseline satisfaction:', error);
    return {
      percentage: currentSatisfactionPct,
      date: new Date().toISOString(),
    };
  }
}

/**
 * Calcule le delta de satisfaction (toujours >= 0)
 */
export function computeSatisfactionDelta(current: number, baseline: number): number {
  const delta = current - baseline;
  return Math.max(0, delta); // Ne jamais afficher de valeur négative
}

/**
 * Récupère ou initialise la baseline pour un établissement
 * @param establishmentId - ID de l'établissement
 * @param currentAvgScore - Note moyenne actuelle (utilisée pour initialiser si baseline absente)
 * @returns La baseline (score et date)
 */
export function getBaselineScore(
  establishmentId: string,
  currentAvgScore: number
): BaselineData {
  const key = `${BASELINE_PREFIX}${establishmentId}`;
  
  try {
    const stored = localStorage.getItem(key);
    
    if (stored) {
      const baseline: BaselineData = JSON.parse(stored);
      return baseline;
    }
    
    // Pas de baseline → initialiser avec la note actuelle
    const newBaseline: BaselineData = {
      score: currentAvgScore,
      date: new Date().toISOString(),
    };
    
    localStorage.setItem(key, JSON.stringify(newBaseline));
    return newBaseline;
  } catch (error) {
    console.error('Error managing baseline score:', error);
    // Fallback: retourner la note actuelle comme baseline
    return {
      score: currentAvgScore,
      date: new Date().toISOString(),
    };
  }
}

/**
 * Formate le delta avec virgule française et signe
 * @param delta - Différence entre note courante et baseline
 * @returns String formaté (ex: "+0,3" ou "-0,2" ou "0,0")
 */
export function formatDelta(delta: number): string {
  const formatted = delta.toLocaleString('fr-FR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: 'always',
  });
  return formatted;
}

/**
 * Calcule le statut de l'évolution
 * @param delta - Différence entre note courante et baseline
 * @returns 'increase' | 'decrease' | 'stable'
 */
export function getEvolutionStatus(delta: number): 'increase' | 'decrease' | 'stable' {
  if (delta > 0) return 'increase';
  if (delta < 0) return 'decrease';
  return 'stable';
}
