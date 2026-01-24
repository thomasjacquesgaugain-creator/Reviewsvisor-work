/**
 * Utilitaires pour le traitement et la normalisation des avis
 */

export type CanonicalSentiment = 'positive' | 'neutral' | 'negative';
export type CanonicalTheme = 'SERVICE' | 'CUISINE' | 'AMBIANCE' | 'PRIX';

/**
 * Normalise un rating depuis différents formats vers un nombre 1-5
 */
export function normalizeRating(rating: any): number {
  if (typeof rating === 'number') {
    // Clamp entre 1 et 5
    return Math.max(1, Math.min(5, Math.round(rating)));
  }

  if (typeof rating === 'string') {
    const upperRating = rating.toUpperCase().trim();
    
    // Format enum (ONE, TWO, THREE, FOUR, FIVE)
    const enumMap: Record<string, number> = {
      'ONE': 1,
      'TWO': 2,
      'THREE': 3,
      'FOUR': 4,
      'FIVE': 5,
    };
    
    if (enumMap[upperRating]) {
      return enumMap[upperRating];
    }
    
    // Format numérique string ("1", "2", etc.)
    const numRating = parseInt(upperRating, 10);
    if (!isNaN(numRating) && numRating >= 1 && numRating <= 5) {
      return numRating;
    }
  }

  // Fallback: retourner 3 (neutre) si non reconnu
  console.warn(`[normalizeRating] Rating non reconnu: ${rating}, fallback à 3`);
  return 3;
}

/**
 * Calcule le sentiment canonique à partir d'un rating
 * - rating <= 2 → "negative"
 * - rating == 3 → "neutral"
 * - rating >= 4 → "positive"
 */
export function computeSentimentFromRating(rating: number | any): CanonicalSentiment {
  const normalized = normalizeRating(rating);
  
  if (normalized <= 2) {
    return 'negative';
  }
  if (normalized === 3) {
    return 'neutral';
  }
  // normalized >= 4
  return 'positive';
}

/**
 * Mapping de synonymes vers les thèmes canoniques
 */
const THEME_SYNONYMS: Record<CanonicalTheme, string[]> = {
  PRIX: [
    'prix', 'tarif', 'tarifs', 'cher', 'chère', 'coût', 'coûts',
    'rapport qualité/prix', 'qualité/prix', 'qualité-prix',
    'value', 'expensive', 'price', 'pricing', 'prix élevés',
    'trop cher', 'coûteux', 'coûteuse', 'bon marché', 'pas cher',
    'raisonnable', 'addition', 'facture', 'payer', 'payé'
  ],
  AMBIANCE: [
    'ambiance', 'atmosphère', 'bruyant', 'bruit', 'musique',
    'salle', 'convivial', 'chaleureux', 'chaleureuse', 'cosy',
    'décor', 'décoration', 'calme', 'tapage', 'fort', 'forte',
    'musique forte', 'agréable', 'désagréable'
  ],
  SERVICE: [
    'service', 'serveur', 'serveuse', 'accueil', 'attente',
    'sympa', 'souriant', 'souriante', 'personnel', 'staff',
    'équipe', 'gentil', 'gentille', 'aimable', 'chaleureux',
    'chaleureuse', 'lent', 'lente', 'rapide', 'efficace',
    'retard', 'ralenti', 'trop long', 'patienter', 'vite'
  ],
  CUISINE: [
    'cuisine', 'plats', 'plat', 'viande', 'poisson', 'frites',
    'menu', 'carte', 'délicieux', 'délicieuse', 'bon', 'bonne',
    'froid', 'froide', 'cuisson', 'nourriture', 'repas',
    'goût', 'qualité', 'assiette', 'mauvais', 'mauvaise',
    'pas bon', 'sec', 'cru', 'trop cuit', 'fade', 'excellent',
    'excellente', 'très bon', 'savoureux', 'savoureuse', 'parfait',
    'parfaite', 'cocktail', 'tapas', 'vin', 'boisson', 'dessert',
    'fromage', 'charcuterie', 'burger', 'pizza', 'salade', 'pasta'
  ]
};

/**
 * Mappe un texte ou label vers un thème canonique
 * Retourne null si aucun thème ne correspond
 */
export function mapTextToTheme(text: string | null | undefined): CanonicalTheme | null {
  if (!text) return null;
  
  const textLower = text.toLowerCase().trim();
  
  // Vérifier chaque thème et ses synonymes
  for (const [theme, synonyms] of Object.entries(THEME_SYNONYMS)) {
    if (synonyms.some(synonym => textLower.includes(synonym.toLowerCase()))) {
      return theme as CanonicalTheme;
    }
  }
  
  return null;
}

/**
 * Mappe un label de thème (potentiellement en français) vers un thème canonique
 * Gère aussi les variations de casse et les espaces
 */
export function mapThemeLabel(label: string | null | undefined): CanonicalTheme | null {
  if (!label) return null;
  
  const labelLower = label.toLowerCase().trim();
  
  // Mapping direct des labels français courants
  const labelMap: Record<string, CanonicalTheme> = {
    'service': 'SERVICE',
    'service / attente': 'SERVICE',
    'cuisine': 'CUISINE',
    'cuisine / produits': 'CUISINE',
    'produits / offre': 'CUISINE',
    'ambiance': 'AMBIANCE',
    'ambiance / bruit': 'AMBIANCE',
    'prix': 'PRIX',
    'rapport qualité/prix': 'PRIX',
    'rapport qualité-prix': 'PRIX',
    'qualité/prix': 'PRIX',
    'qualité-prix': 'PRIX',
    'bon rapport qualité/prix': 'PRIX',
  };
  
  if (labelMap[labelLower]) {
    return labelMap[labelLower];
  }
  
  // Fallback: essayer de mapper via les synonymes
  return mapTextToTheme(label);
}

/**
 * Extrait les mots-clés d'un texte avec leur sentiment associé
 */
export function extractKeywordsWithSentiment(
  text: string,
  reviewSentiment: CanonicalSentiment
): Array<{ word: string; sentiment: CanonicalSentiment }> {
  if (!text) return [];
  
  // Stop words à exclure
  const STOP_WORDS = new Set([
    'très', 'bonne', 'bon', 'bien', 'plus', 'moins', 'assez', 'tout', 'tous', 'toute', 'toutes',
    'un', 'une', 'des', 'de', 'du', 'le', 'la', 'les', 'est', 'sont', 'était', 'être', 'avoir',
    'pour', 'avec', 'sans', 'dans', 'sur', 'par', 'que', 'qui', 'quoi', 'comme', 'mais', 'ou',
    'et', 'donc', 'car', 'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'leur', 'leurs', 'nos', 'notre'
  ]);
  
  // Nettoyer et extraire les mots
  const cleaned = text
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüÿç]/g, ' ')
    .split(/\s+/)
    .filter(word => {
      return word.length > 3 && !STOP_WORDS.has(word);
    });
  
  // Retourner les mots avec le sentiment de l'avis
  return cleaned.map(word => ({
    word: word.trim(),
    sentiment: reviewSentiment
  }));
}

/**
 * Agrège les mots-clés par sentiment, thème ou fréquence
 */
export interface KeywordAggregation {
  word: string;
  count: number;
  sentiment?: CanonicalSentiment;
  theme?: CanonicalTheme;
}

export function aggregateKeywords(
  reviews: Array<{ text: string; rating: any; themes?: Array<{ name: string }> }>,
  mode: 'frequency' | 'sentiment' | 'theme'
): {
  bySentiment?: Record<CanonicalSentiment, KeywordAggregation[]>;
  byTheme?: Record<CanonicalTheme, KeywordAggregation[]>;
  byFrequency?: KeywordAggregation[];
} {
  const wordCounts = new Map<string, {
    count: number;
    sentiments: Map<CanonicalSentiment, number>;
    themes: Map<CanonicalTheme, number>;
  }>();
  
  // Parcourir tous les avis
  for (const review of reviews) {
    const sentiment = computeSentimentFromRating(review.rating);
    const keywords = extractKeywordsWithSentiment(review.text || '', sentiment);
    
    // Extraire les thèmes de l'avis
    const reviewThemes = new Set<CanonicalTheme>();
    if (review.themes && Array.isArray(review.themes)) {
      for (const theme of review.themes) {
        const canonicalTheme = mapThemeLabel(theme.name);
        if (canonicalTheme) {
          reviewThemes.add(canonicalTheme);
        }
      }
    }
    
    // Si aucun thème explicite, essayer de détecter depuis le texte
    if (reviewThemes.size === 0) {
      const detectedTheme = mapTextToTheme(review.text);
      if (detectedTheme) {
        reviewThemes.add(detectedTheme);
      }
    }
    
    // Agrégation par mot-clé
    for (const { word, sentiment: wordSentiment } of keywords) {
      if (!wordCounts.has(word)) {
        wordCounts.set(word, {
          count: 0,
          sentiments: new Map(),
          themes: new Map()
        });
      }
      
      const entry = wordCounts.get(word)!;
      entry.count += 1;
      
      // Compter par sentiment
      entry.sentiments.set(
        wordSentiment,
        (entry.sentiments.get(wordSentiment) || 0) + 1
      );
      
      // Compter par thème (si le mot apparaît dans un avis avec ce thème)
      for (const theme of reviewThemes) {
        entry.themes.set(
          theme,
          (entry.themes.get(theme) || 0) + 1
        );
      }
    }
  }
  
  // Construire les résultats selon le mode
  const result: {
    bySentiment?: Record<CanonicalSentiment, KeywordAggregation[]>;
    byTheme?: Record<CanonicalTheme, KeywordAggregation[]>;
    byFrequency?: KeywordAggregation[];
  } = {};
  
  if (mode === 'frequency' || mode === 'sentiment') {
    const bySentiment: Record<CanonicalSentiment, KeywordAggregation[]> = {
      positive: [],
      neutral: [],
      negative: []
    };
    
    for (const [word, data] of wordCounts.entries()) {
      // Déterminer le sentiment dominant pour ce mot
      let dominantSentiment: CanonicalSentiment = 'neutral';
      let maxSentimentCount = 0;
      
      for (const [sentiment, count] of data.sentiments.entries()) {
        if (count > maxSentimentCount) {
          maxSentimentCount = count;
          dominantSentiment = sentiment;
        }
      }
      
      bySentiment[dominantSentiment].push({
        word,
        count: data.count,
        sentiment: dominantSentiment
      });
    }
    
    // Trier par fréquence décroissante
    Object.keys(bySentiment).forEach(key => {
      bySentiment[key as CanonicalSentiment].sort((a, b) => b.count - a.count);
    });
    
    result.bySentiment = bySentiment;
  }
  
  if (mode === 'frequency' || mode === 'theme') {
    const byTheme: Record<CanonicalTheme, KeywordAggregation[]> = {
      SERVICE: [],
      CUISINE: [],
      AMBIANCE: [],
      PRIX: []
    };
    
    for (const [word, data] of wordCounts.entries()) {
      // Déterminer le thème dominant pour ce mot
      let dominantTheme: CanonicalTheme | null = null;
      let maxThemeCount = 0;
      
      for (const [theme, count] of data.themes.entries()) {
        if (count > maxThemeCount) {
          maxThemeCount = count;
          dominantTheme = theme;
        }
      }
      
      // Si aucun thème détecté, essayer de mapper le mot lui-même
      if (!dominantTheme) {
        dominantTheme = mapTextToTheme(word);
      }
      
      if (dominantTheme) {
        byTheme[dominantTheme].push({
          word,
          count: data.count,
          theme: dominantTheme
        });
      }
    }
    
    // Trier par fréquence décroissante
    Object.keys(byTheme).forEach(key => {
      byTheme[key as CanonicalTheme].sort((a, b) => b.count - a.count);
    });
    
    result.byTheme = byTheme;
  }
  
  if (mode === 'frequency') {
    result.byFrequency = Array.from(wordCounts.entries())
      .map(([word, data]) => ({
        word,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  return result;
}
