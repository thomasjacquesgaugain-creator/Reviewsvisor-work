/**
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
}

/**
 * Formate les recommandations pour l'affichage
 * Assure que les recommandations sont un tableau de strings
 */
export function formatRecommendations(
  recommendations: any
): string[] {
  if (!recommendations) return [];

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

  return [];
}
