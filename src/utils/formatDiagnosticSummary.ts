/**
 * Formate le résumé de diagnostic depuis les données brutes
 * Gère les cas où summary est une string, un objet JSON, ou null/undefined
 */
export function formatDiagnosticSummary(
  summary: any,
  diagnosticInsights?: {
    totalReviews?: number;
    avgRating?: number;
    positivePercentage?: number;
    negativePercentage?: number;
    topStrengths?: Array<{ theme: string; count: number; percentage: number }>;
    topWeaknesses?: Array<{ theme: string; count: number; percentage: number }>;
  }
): string {
  // Si summary est déjà une string valide, la retourner
  if (typeof summary === 'string' && summary.trim().length > 0) {
    return summary.trim();
  }

  // Si summary est un objet, essayer d'extraire le texte
  if (summary && typeof summary === 'object') {
    // Cas 1: summary.resume ou summary.summary
    if (summary.resume && typeof summary.resume === 'string') {
      return summary.resume.trim();
    }
    if (summary.summary && typeof summary.summary === 'string') {
      return summary.summary.trim();
    }
    
    // Cas 2: summary est un objet avec des propriétés structurées
    if (summary.text && typeof summary.text === 'string') {
      return summary.text.trim();
    }
    
    // Cas 3: Essayer de convertir l'objet en string JSON (fallback)
    try {
      const jsonString = JSON.stringify(summary);
      // Si c'est un objet simple, ne pas retourner le JSON brut
      if (jsonString.length < 500) {
        return jsonString;
      }
    } catch (e) {
      // Ignorer les erreurs de stringify
    }
  }

  // Si pas de summary mais qu'on a des insights, générer un résumé basique
  if (diagnosticInsights) {
    const parts: string[] = [];
    
    if (diagnosticInsights.totalReviews && diagnosticInsights.totalReviews > 0) {
      parts.push(`Analyse de ${diagnosticInsights.totalReviews} avis client${diagnosticInsights.totalReviews > 1 ? 's' : ''}.`);
    }
    
    if (diagnosticInsights.avgRating !== undefined) {
      parts.push(`Note moyenne : ${diagnosticInsights.avgRating.toFixed(1)}/5.`);
    }
    
    if (diagnosticInsights.positivePercentage !== undefined) {
      parts.push(`${diagnosticInsights.positivePercentage.toFixed(0)}% d'avis positifs.`);
    }
    
    if (diagnosticInsights.topWeaknesses && diagnosticInsights.topWeaknesses.length > 0) {
      const mainIssue = diagnosticInsights.topWeaknesses[0];
      parts.push(`Problème principal : ${mainIssue.theme} (${mainIssue.count} mentions).`);
    }
    
    if (diagnosticInsights.topStrengths && diagnosticInsights.topStrengths.length > 0) {
      const mainStrength = diagnosticInsights.topStrengths[0];
      parts.push(`Point fort principal : ${mainStrength.theme} (${mainStrength.count} mentions).`);
    }
    
    if (parts.length > 0) {
      return parts.join(' ');
    }
  }

  // Fallback : message par défaut
  return "Aucun résumé disponible pour le moment.";
}

/**
 * Formate les recommandations pour l'affichage
 * Assure que les recommandations sont un tableau de strings
 */
export function formatRecommendations(
  recommendations: any
): string[] {
  if (!recommendations) return [];

  // Si c'est déjà un tableau de strings, le retourner tel quel
  if (Array.isArray(recommendations)) {
    return recommendations
      .map(rec => {
        if (typeof rec === 'string') {
          return rec.trim();
        }
        // Si c'est un objet, essayer d'extraire le texte
        if (typeof rec === 'object') {
          return (rec as any).text || (rec as any).recommendation || (rec as any).title || JSON.stringify(rec);
        }
        return String(rec);
      })
      .filter(rec => rec && rec.length > 0);
  }

  // Si c'est une string, essayer de la parser comme JSON
  if (typeof recommendations === 'string') {
    const trimmed = recommendations.trim();
    
    // Si c'est une string simple (pas de JSON), la retourner comme une seule recommandation
    if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) {
      return trimmed.length > 0 ? [trimmed] : [];
    }
    
    // Essayer de parser comme JSON
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return formatRecommendations(parsed);
      }
      if (parsed && typeof parsed === 'object') {
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          return formatRecommendations(parsed.recommendations);
        }
        // Si c'est un objet simple, essayer d'extraire des propriétés
        const values = Object.values(parsed).filter(v => typeof v === 'string' && v.length > 0);
        if (values.length > 0) {
          return values as string[];
        }
      }
    } catch (e) {
      // Si le parsing échoue, traiter comme une seule recommandation
      return trimmed.length > 0 ? [trimmed] : [];
    }
  }

  // Si c'est un objet, essayer d'extraire les recommandations
  if (typeof recommendations === 'object') {
    // Cas 1: recommendations.recommendations
    if ((recommendations as any).recommendations) {
      return formatRecommendations((recommendations as any).recommendations);
    }
    
    // Cas 2: recommendations.items ou recommendations.list
    if ((recommendations as any).items && Array.isArray((recommendations as any).items)) {
      return formatRecommendations((recommendations as any).items);
    }
    if ((recommendations as any).list && Array.isArray((recommendations as any).list)) {
      return formatRecommendations((recommendations as any).list);
    }
    
    // Cas 3: Objet avec des propriétés numérotées (rec1, rec2, etc.)
    const numberedRecs = Object.keys(recommendations)
      .filter(key => /^rec\d+$/i.test(key) || /^recommendation\d+$/i.test(key))
      .map(key => (recommendations as any)[key])
      .filter(rec => typeof rec === 'string' && rec.length > 0);
    
    if (numberedRecs.length > 0) {
      return numberedRecs;
    }
  }

  // Fallback : retourner un tableau vide
  return [];
}
