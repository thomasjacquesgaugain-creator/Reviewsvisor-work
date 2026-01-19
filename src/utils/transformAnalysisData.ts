import { CompleteAnalysisData, Review } from "@/types/analysis";
import { format, parseISO, subMonths } from "date-fns";
import { cleanReviewText, STOP_WORDS } from "@/utils/cleanReviewText";
import { formatDiagnosticSummary, formatRecommendations } from "@/utils/formatDiagnosticSummary";

/**
 * Transforme les données brutes (insight + reviews) en structure CompleteAnalysisData
 */
export function transformAnalysisData(
  insight: any,
  reviews: Review[]
): CompleteAnalysisData {
  // Protection contre les données null/undefined
  const safeReviews = reviews || [];
  const safeInsight = insight || {};
  
  const totalReviews = safeReviews.length || safeInsight?.total_count || 0;
  const avgRating = safeInsight?.avg_rating || 0;
  const positiveRatio = safeInsight?.positive_ratio || 0;

  // Calculer la tendance (comparaison avec il y a 3 mois)
  let trend: 'up' | 'down' | 'stable' = 'stable';
  let trendValue = 0;
  if (safeReviews.length > 0) {
    const threeMonthsAgo = subMonths(new Date(), 3);
    const recentReviews = safeReviews.filter(r => {
      try {
        const dateStr = (r as any).published_at || r.date;
        if (!dateStr) return false;
        const reviewDate = parseISO(dateStr);
        return !isNaN(reviewDate.getTime()) && reviewDate >= threeMonthsAgo;
      } catch {
        return false;
      }
    });
    const olderReviews = safeReviews.filter(r => {
      try {
        const dateStr = (r as any).published_at || r.date;
        if (!dateStr) return false;
        const reviewDate = parseISO(dateStr);
        return !isNaN(reviewDate.getTime()) && reviewDate < threeMonthsAgo;
      } catch {
        return false;
      }
    });

    if (recentReviews.length > 0 && olderReviews.length > 0) {
      const recentAvg = recentReviews.reduce((sum, r) => sum + r.note, 0) / recentReviews.length;
      const olderAvg = olderReviews.reduce((sum, r) => sum + r.note, 0) / olderReviews.length;
      trendValue = ((recentAvg - olderAvg) / olderAvg) * 100;
      if (trendValue > 2) trend = 'up';
      else if (trendValue < -2) trend = 'down';
    }
  }

  // Calculer les pourcentages depuis les vrais avis si possible
  let positivePercentage = positiveRatio * 100;
  let negativePercentage = (1 - positiveRatio) * 100;
  let neutralPercentage = 0;
  
  if (safeReviews.length > 0) {
    // Recalculer depuis les avis réels pour plus de précision
    const positiveCount = safeReviews.filter(r => r.note >= 4).length;
    const negativeCount = safeReviews.filter(r => r.note <= 2).length;
    const neutralCount = totalReviews - positiveCount - negativeCount;
    
    positivePercentage = (positiveCount / totalReviews) * 100;
    negativePercentage = (negativeCount / totalReviews) * 100;
    neutralPercentage = (neutralCount / totalReviews) * 100;
  }

  // Vue d'ensemble
  const overview = {
    averageRating: avgRating || (safeReviews.length > 0 
      ? safeReviews.reduce((sum, r) => sum + (r.note || 0), 0) / safeReviews.length 
      : 0),
    totalReviews,
    positivePercentage,
    negativePercentage,
    neutralPercentage,
    trend,
    trendValue
  };

  // Historique - grouper par mois depuis published_at ou date
  const historyMap = new Map<string, { sum: number; count: number }>();
  safeReviews.forEach(review => {
    try {
      if (!review.note) return;
      // Utiliser published_at si disponible, sinon date
      const dateStr = (review as any).published_at || review.date;
      if (!dateStr) return;
      
      const date = parseISO(dateStr);
      if (isNaN(date.getTime())) return; // Date invalide
      
      const monthKey = format(date, 'yyyy-MM');
      const existing = historyMap.get(monthKey) || { sum: 0, count: 0 };
      existing.sum += review.note;
      existing.count += 1;
      historyMap.set(monthKey, existing);
    } catch (e) {
      // Ignorer les dates invalides
      console.warn('Date invalide pour review:', review.date);
    }
  });

  const history = Array.from(historyMap.entries())
    .map(([date, data]) => ({
      date,
      rating: data.count > 0 ? data.sum / data.count : 0,
      count: data.count
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Sentiment
  const positiveCount = safeReviews.filter(r => r.note >= 4).length;
  const negativeCount = safeReviews.filter(r => r.note <= 2).length;
  const neutralCount = totalReviews - positiveCount - negativeCount;

  const sentiment = {
    positive: positiveCount,
    neutral: neutralCount,
    negative: negativeCount
  };

  // Pareto Issues
  const paretoIssues = (safeInsight?.top_issues || []).map((issue: any, index: number) => {
    const count = issue.count || 0;
    return {
      name: issue.theme || issue.issue || `Problème ${index + 1}`,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0
    };
  });

  // Pareto Strengths
  const paretoStrengths = (safeInsight?.top_praises || []).map((strength: any, index: number) => {
    const count = strength.count || 0;
    return {
      name: strength.theme || strength.strength || `Point fort ${index + 1}`,
      count,
      percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0
    };
  });

  // Thèmes - utiliser les données de l'IA si disponibles, sinon calculer depuis les avis
  let themes = [];
  if (safeInsight?.themes && Array.isArray(safeInsight.themes) && safeInsight.themes.length > 0) {
    // Utiliser les thèmes de l'IA
    themes = safeInsight.themes.map((theme: any) => ({
      theme: theme.theme || theme,
      score: theme.score || (theme.count / totalReviews) || 0.5,
      count: theme.count || 0,
      verbatims: theme.verbatims || []
    }));
  } else {
    // Calculer les thèmes depuis les top_issues et top_praises
    const allThemes = new Map<string, { count: number; score: number }>();
    
    // Ajouter les problèmes (score bas)
    (safeInsight?.top_issues || []).forEach((issue: any) => {
      const themeName = issue.theme || issue.issue || '';
      if (themeName) {
        const count = issue.count || 0;
        allThemes.set(themeName, { count, score: Math.max(0, 1 - (count / totalReviews)) });
      }
    });
    
    // Ajouter les points forts (score haut)
    (safeInsight?.top_praises || []).forEach((strength: any) => {
      const themeName = strength.theme || strength.strength || '';
      if (themeName) {
        const count = strength.count || 0;
        const existing = allThemes.get(themeName);
        if (existing) {
          // Si le thème existe déjà (problème + point fort), moyenner les scores
          existing.count += count;
          existing.score = Math.max(0.5, existing.score + (count / totalReviews));
        } else {
          allThemes.set(themeName, { count, score: Math.min(1, 0.5 + (count / totalReviews)) });
        }
      }
    });
    
    themes = Array.from(allThemes.entries()).map(([theme, data]) => ({
      theme,
      score: data.score,
      count: data.count,
      verbatims: []
    }));
  }

  // Analyse qualitative - extraire les mots-clés des reviews nettoyés
  const wordCounts = new Map<string, number>();
  
  safeReviews.forEach(review => {
    const rawText = (review as any).text || review.texte;
    if (!rawText) return;
    
    // Nettoyer le texte pour extraire uniquement la partie française
    const cleanedText = cleanReviewText(rawText);
    if (!cleanedText) return;
    
    // Nettoyer et extraire les mots (garder les accents français)
    const cleaned = cleanedText.toLowerCase()
      .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, ' ')
      .split(/\s+/)
      .filter(word => {
        // Filtrer : longueur > 3 caractères et pas un stop word
        return word.length > 3 && !STOP_WORDS.has(word.toLowerCase());
      });
    
    cleaned.forEach(word => {
      if (word.length > 3) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });
  });

  const topKeywords = Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15) // Prendre plus de mots pour un meilleur nuage
    .map(([word, count]) => ({ word, count }));

  // Verbatims clés - prendre les avis les plus représentatifs (texte nettoyé en français)
  const keyVerbatims = safeReviews
    .map(r => {
      const rawText = (r as any).text || r.texte;
      if (!rawText) return null;
      
      // Nettoyer le texte pour extraire uniquement la partie française
      const cleanedText = cleanReviewText(rawText);
      if (!cleanedText || cleanedText.length < 20) return null;
      
      return {
        ...r,
        cleanedText
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => {
      // Prioriser les avis avec des notes extrêmes (1, 5) ou neutres (3)
      const ratingA = a.note || 0;
      const ratingB = b.note || 0;
      const importanceA = ratingA === 1 || ratingA === 5 || ratingA === 3 ? 1 : 0;
      const importanceB = ratingB === 1 || ratingB === 5 || ratingB === 3 ? 1 : 0;
      if (importanceA !== importanceB) return importanceB - importanceA;
      return (b as any).published_at ? 1 : -1; // Prioriser les plus récents
    })
    .slice(0, 8) // Prendre plus de verbatims
    .map(r => ({
      text: r.cleanedText.substring(0, 200) + (r.cleanedText.length > 200 ? '...' : ''),
      rating: r.note || 0,
      sentiment: (r.note || 0) >= 4 ? 'positive' as const : (r.note || 0) <= 2 ? 'negative' as const : 'neutral' as const
    }));

  const qualitative = {
    topKeywords,
    keyVerbatims
  };

  // Préparer les données pour le formatage du résumé
  const diagnosticInsights = {
    totalReviews,
    avgRating: overview.averageRating,
    positivePercentage: overview.positivePercentage,
    negativePercentage: overview.negativePercentage,
    topStrengths: paretoStrengths.slice(0, 3).map(s => ({
      theme: s.name,
      count: s.count,
      percentage: s.percentage
    })),
    topWeaknesses: paretoIssues.slice(0, 3).map(i => ({
      theme: i.name,
      count: i.count,
      percentage: i.percentage
    }))
  };

  // Diagnostic - formater le résumé depuis summary (peut être un objet JSON ou une string)
  const summaryText = formatDiagnosticSummary(safeInsight?.summary, diagnosticInsights);

  // Recommandations - peut être dans summary.recommendations ou directement dans recommendations
  let recommendations: string[] = [];
  if (safeInsight?.recommendations) {
    recommendations = formatRecommendations(safeInsight.recommendations);
  } else if (safeInsight?.summary && typeof safeInsight.summary === 'object') {
    const summaryObj = safeInsight.summary as any;
    if (summaryObj.recommendations) {
      recommendations = formatRecommendations(summaryObj.recommendations);
    }
  }

  const diagnostic = {
    summary: summaryText,
    topStrengths: diagnosticInsights.topStrengths,
    topWeaknesses: diagnosticInsights.topWeaknesses,
    recommendations
  };

  return {
    overview,
    history,
    sentiment,
    paretoIssues,
    paretoStrengths,
    themes,
    qualitative,
    diagnostic
  };
}
