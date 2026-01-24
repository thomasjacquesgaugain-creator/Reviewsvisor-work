/**
<<<<<<< HEAD
 * Génère un texte de résumé lisible à partir des données d'analyse
 * Si le summary est déjà un texte, le retourne tel quel
 * Sinon, génère un texte formaté depuis les données JSON
 */
export function formatDiagnosticSummary(
  summary: string | object | null | undefined,
  insights: {
    totalReviews: number;
    avgRating: number;
    positivePercentage: number;
    negativePercentage: number;
    topStrengths: Array<{ theme: string; count: number; percentage: number }>;
    topWeaknesses: Array<{ theme: string; count: number; percentage: number }>;
  }
): string {
  // Si c'est déjà un texte lisible, le retourner
  if (typeof summary === 'string' && summary.trim() && !summary.startsWith('{')) {
    return summary;
  }

  // Si c'est un objet JSON, générer un texte lisible
  if (typeof summary === 'object' && summary !== null) {
    const summaryObj = summary as any;
    
    // Vérifier s'il y a déjà un résumé textuel dans l'objet
    if (summaryObj.resume && typeof summaryObj.resume === 'string') {
      return summaryObj.resume;
    }
    if (summaryObj.summary && typeof summaryObj.summary === 'string' && !summaryObj.summary.startsWith('{')) {
      return summaryObj.summary;
    }
  }

  // Générer un résumé automatique depuis les données
  const parts: string[] = [];
  
  // Note moyenne et total d'avis
  if (insights.totalReviews > 0) {
    const reputation = insights.avgRating >= 4.5 ? 'excellente' :
                       insights.avgRating >= 4.0 ? 'bonne' :
                       insights.avgRating >= 3.5 ? 'correcte' :
                       insights.avgRating >= 3.0 ? 'moyenne' : 'faible';
    
    parts.push(`Votre établissement bénéficie d'une ${reputation} réputation avec une note moyenne de ${insights.avgRating.toFixed(1)}/5 sur ${insights.totalReviews} avis.`);
  }

  // Pourcentage d'avis positifs/négatifs
  if (insights.positivePercentage > 0) {
    parts.push(`${Math.round(insights.positivePercentage)}% des avis sont positifs.`);
  }
  
  if (insights.negativePercentage > 20) {
    parts.push(`${Math.round(insights.negativePercentage)}% des avis sont négatifs.`);
  }

  // Points forts principaux
  if (insights.topStrengths.length > 0) {
    const strengthsList = insights.topStrengths
      .slice(0, 2)
      .map(s => s.theme.toLowerCase())
      .join(' et ');
    
    if (strengthsList) {
      parts.push(`Les points forts principaux sont ${strengthsList}.`);
    }
  }

  // Axes d'amélioration
  if (insights.topWeaknesses.length > 0) {
    const weaknessesList = insights.topWeaknesses
      .slice(0, 2)
      .map(w => w.theme.toLowerCase())
      .join(' et ');
    
    if (weaknessesList) {
      parts.push(`Les axes d'amélioration concernent ${weaknessesList}.`);
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'Aucun résumé disponible.';
=======
 * Formate le résumé de diagnostic depuis les données brutes
 * Gère les cas où summary est une string, un objet JSON, ou null/undefined
 */
import { normalizeSummary } from "@/utils/normalizeSummary";

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

    // Cas 3: Résumé structuré (ne jamais retourner du JSON brut)
    const normalized = normalizeSummary(summary);
    if (normalized?.text) {
      return normalized.text;
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
>>>>>>> origin/branche-papa
}

/**
 * Formate les recommandations pour l'affichage
 * Assure que les recommandations sont un tableau de strings
 */
export function formatRecommendations(
  recommendations: any
): string[] {
  if (!recommendations) return [];

<<<<<<< HEAD
  // Si c'est déjà un tableau de strings
  if (Array.isArray(recommendations)) {
    return recommendations
      .map(rec => {
        if (typeof rec === 'string') return rec;
        if (typeof rec === 'object' && rec !== null) {
          // Essayer d'extraire le texte
          return (rec as any).text || (rec as any).recommendation || (rec as any).title || JSON.stringify(rec);
        }
        return String(rec);
      })
      .filter(rec => rec && rec.trim() && !rec.startsWith('{'));
  }

  // Si c'est un string, essayer de le parser ou le retourner tel quel
  if (typeof recommendations === 'string') {
    // Si c'est du JSON, essayer de le parser
    if (recommendations.trim().startsWith('[') || recommendations.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(recommendations);
        if (Array.isArray(parsed)) {
          return formatRecommendations(parsed);
        }
        if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
          return formatRecommendations(parsed.recommendations);
        }
      } catch {
        // Si le parsing échoue, traiter comme une seule recommandation
        return [recommendations];
      }
    }
    // Si c'est une string simple, la retourner comme une seule recommandation
    return [recommendations];
  }

=======
  // Si c'est déjà un tableau de strings, le retourner tel quel
  if (Array.isArray(recommendations)) {
    return recommendations
      .map(rec => {
        if (typeof rec === 'string') {
          return rec.trim();
        }
        // Si c'est un objet, essayer d'extraire le texte
        if (typeof rec === 'object') {
          const r = rec as any;
          return (
            r.text ||
            r.recommendation ||
            r.title ||
            r.label ||
            r.reason ||
            ""
          ).toString().trim();
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
>>>>>>> origin/branche-papa
  return [];
}
