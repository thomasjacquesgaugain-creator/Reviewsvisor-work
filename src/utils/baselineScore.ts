/**
 * Gestion de la baseline (note de référence) pour chaque établissement
 */

interface BaselineData {
  score: number;
  date: string;
}

const BASELINE_PREFIX = 'baselineScore::';

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
