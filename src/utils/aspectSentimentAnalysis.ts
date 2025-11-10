/**
 * Analyse NLP aspect-based des avis
 * Détecte les aspects (Cuisine, Service, Rapidité, Ambiance) et leur polarité
 */

export interface AspectCount {
  positiveCount: number;
  negativeCount: number;
  totalCount: number;
  positivePct: number;
  negativePct: number;
}

export interface AspectAnalysis {
  [aspect: string]: AspectCount;
}

export interface ThemeScore {
  theme: string;
  score: number;
  positiveCount: number;
  negativeCount: number;
  totalCount: number;
}

// Dictionnaires de mots-clés par aspect
const ASPECT_KEYWORDS: Record<string, string[]> = {
  Cuisine: [
    'cuisine', 'plat', 'nourriture', 'menu', 'repas', 'cuisson', 
    'saveur', 'goût', 'ingrédient', 'recette', 'qualité', 'frais',
    'pizza', 'burger', 'viande', 'poisson', 'dessert', 'entrée',
    'salade', 'soupe', 'pâtes', 'riz'
  ],
  Service: [
    'service', 'serveur', 'serveuse', 'personnel', 'accueil', 'staff',
    'équipe', 'attentif', 'disponible', 'souriant', 'professionnel',
    'patron', 'gérant', 'employé', 'conseil'
  ],
  Rapidité: [
    'rapide', 'rapidité', 'attente', 'temps', 'délai', 'long', 'lent',
    'vitesse', 'minute', 'heure', 'prompt', 'immédiat', 'tard', 'retard'
  ],
  Ambiance: [
    'ambiance', 'atmosphère', 'décor', 'cadre', 'lieu', 'endroit',
    'design', 'intérieur', 'musique', 'bruit', 'calme', 'animation',
    'terrasse', 'salle', 'luminosité', 'espace'
  ]
};

// Mots positifs
const POSITIVE_WORDS = [
  'bon', 'bonne', 'excellent', 'super', 'parfait', 'délicieux',
  'génial', 'formidable', 'incroyable', 'merveilleux', 'fantastique',
  'agréable', 'sympa', 'top', 'magnifique', 'savoureux', 'frais',
  'exceptionnel', 'remarquable', 'sublime', 'succulent', 'copieux',
  'raffiné', 'délicatement', 'qualité', 'recommande', 'satisfait',
  'ravi', 'heureux', 'content', 'apprécié'
];

// Mots négatifs
const NEGATIVE_WORDS = [
  'mauvais', 'mauvaise', 'horrible', 'médiocre', 'nul', 'décevant',
  'pas bon', 'pas bonne', 'infecte', 'désagréable', 'insipide', 'fade',
  'froid', 'froide', 'brûlé', 'cru', 'sale', 'dégoûtant', 'raté',
  'catastrophe', 'problème', 'erreur', 'oublié', 'manque', 'insuffisant',
  'cher', 'arnaque', 'déception', 'déçu', 'insatisfait', 'éviter'
];

// Négations
const NEGATIONS = ['pas', 'aucun', 'jamais', 'ne', 'non', 'sans', 'ni'];

// Intensificateurs
const INTENSIFIERS = ['très', 'super', 'extrêmement', 'vraiment', 'trop', 'tellement'];

/**
 * Nettoie et normalise le texte
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever accents
    .replace(/[^\w\s]/g, ' ') // Enlever ponctuation
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Détecte les aspects mentionnés dans une phrase
 */
function detectAspects(sentence: string): string[] {
  const normalized = normalizeText(sentence);
  const words = normalized.split(' ');
  const detectedAspects: string[] = [];

  for (const [aspect, keywords] of Object.entries(ASPECT_KEYWORDS)) {
    const hasKeyword = keywords.some(keyword => 
      words.some(word => word.includes(keyword) || keyword.includes(word))
    );
    if (hasKeyword) {
      detectedAspects.push(aspect);
    }
  }

  return detectedAspects;
}

/**
 * Analyse la polarité d'une phrase pour un aspect donné
 * Retourne 1 (positif), -1 (négatif), ou 0 (neutre/incertain)
 */
function analyzeSentiment(sentence: string, aspect: string): number {
  const normalized = normalizeText(sentence);
  const words = normalized.split(' ');

  let positiveScore = 0;
  let negativeScore = 0;
  let hasNegation = false;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    // Détecter négations
    if (NEGATIONS.includes(word)) {
      hasNegation = true;
      continue;
    }

    // Détecter intensificateurs
    const hasIntensifier = i > 0 && INTENSIFIERS.includes(words[i - 1]);
    const multiplier = hasIntensifier ? 2 : 1;

    // Mots positifs
    if (POSITIVE_WORDS.some(pw => word.includes(pw) || pw.includes(word))) {
      positiveScore += multiplier;
    }

    // Mots négatifs
    if (NEGATIVE_WORDS.some(nw => word.includes(nw) || nw.includes(word))) {
      negativeScore += multiplier;
    }
  }

  // Inverser si négation
  if (hasNegation) {
    [positiveScore, negativeScore] = [negativeScore, positiveScore];
  }

  // Déterminer polarité
  if (positiveScore > negativeScore) return 1;
  if (negativeScore > positiveScore) return -1;
  return 0;
}

/**
 * Analyse un avis complet et retourne les aspects avec leur sentiment
 */
function analyzeReview(reviewText: string): Record<string, number> {
  if (!reviewText || typeof reviewText !== 'string') return {};

  // Découper en phrases (approximatif)
  const sentences = reviewText
    .split(/[.!?;]/)
    .filter(s => s.trim().length > 0);

  const aspectSentiments: Record<string, number[]> = {};

  for (const sentence of sentences) {
    const aspects = detectAspects(sentence);
    
    for (const aspect of aspects) {
      const sentiment = analyzeSentiment(sentence, aspect);
      if (sentiment !== 0) {
        if (!aspectSentiments[aspect]) {
          aspectSentiments[aspect] = [];
        }
        aspectSentiments[aspect].push(sentiment);
      }
    }
  }

  // Calculer sentiment majoritaire par aspect
  const result: Record<string, number> = {};
  for (const [aspect, sentiments] of Object.entries(aspectSentiments)) {
    const sum = sentiments.reduce((a, b) => a + b, 0);
    result[aspect] = sum > 0 ? 1 : sum < 0 ? -1 : 0;
  }

  return result;
}

/**
 * Analyse tous les avis et retourne les compteurs par aspect
 */
export function analyzeAllReviews(reviews: any[]): AspectAnalysis {
  const aspects = ['Cuisine', 'Service', 'Rapidité', 'Ambiance'];
  const counts: Record<string, { pos: number; neg: number }> = {};

  // Initialiser
  aspects.forEach(aspect => {
    counts[aspect] = { pos: 0, neg: 0 };
  });

  // Analyser chaque avis
  reviews.forEach(review => {
    const text = review.text || review.comment || '';
    if (!text) return;

    const aspectSentiments = analyzeReview(text);

    for (const [aspect, sentiment] of Object.entries(aspectSentiments)) {
      if (sentiment > 0) {
        counts[aspect].pos++;
      } else if (sentiment < 0) {
        counts[aspect].neg++;
      }
    }
  });

  // Convertir en format final avec pourcentages
  const result: AspectAnalysis = {};
  aspects.forEach(aspect => {
    const pos = counts[aspect].pos;
    const neg = counts[aspect].neg;
    const total = pos + neg;

    result[aspect] = {
      positiveCount: pos,
      negativeCount: neg,
      totalCount: total,
      positivePct: total > 0 ? Math.round((pos / total) * 100) : 0,
      negativePct: total > 0 ? Math.round((neg / total) * 100) : 0
    };
  });

  return result;
}

/**
 * Calcule les Top 3 problèmes (normalisés à 100%)
 */
export function calculateTop3Problems(aspectAnalysis: AspectAnalysis): ThemeScore[] {
  const themes = Object.entries(aspectAnalysis)
    .filter(([_, data]) => data.totalCount > 0);

  // Calculer le score problème pour chaque thème
  const totalAspectMentions = themes.reduce((sum, [_, data]) => sum + data.totalCount, 0);

  const scores = themes.map(([theme, data]) => {
    const freq = data.totalCount / Math.max(1, totalAspectMentions);
    const negativeRatio = data.negativeCount / Math.max(1, data.totalCount);
    const score = negativeRatio * freq;

    return {
      theme,
      score,
      positiveCount: data.positiveCount,
      negativeCount: data.negativeCount,
      totalCount: data.totalCount
    };
  });

  // Trier par score décroissant et prendre top 3
  const top3 = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Normaliser à 100%
  const totalScore = top3.reduce((sum, item) => sum + item.score, 0);
  
  if (totalScore === 0) return [];

  const normalized = top3.map((item, index) => {
    if (index < 2) {
      return {
        ...item,
        normalizedPct: Math.floor((item.score / totalScore) * 100)
      };
    } else {
      // Le 3ème = 100 - somme des 2 premiers
      const sumFirst2 = top3.slice(0, 2).reduce((sum, t) => 
        sum + Math.floor((t.score / totalScore) * 100), 0
      );
      return {
        ...item,
        normalizedPct: 100 - sumFirst2
      };
    }
  });

  return normalized as ThemeScore[];
}

/**
 * Calcule les Top 3 points forts (normalisés à 100%)
 */
export function calculateTop3Strengths(aspectAnalysis: AspectAnalysis): ThemeScore[] {
  const themes = Object.entries(aspectAnalysis)
    .filter(([_, data]) => data.totalCount > 0);

  // Calculer le score positif pour chaque thème
  const totalAspectMentions = themes.reduce((sum, [_, data]) => sum + data.totalCount, 0);

  const scores = themes.map(([theme, data]) => {
    const freq = data.totalCount / Math.max(1, totalAspectMentions);
    const positiveRatio = data.positiveCount / Math.max(1, data.totalCount);
    const score = positiveRatio * freq;

    return {
      theme,
      score,
      positiveCount: data.positiveCount,
      negativeCount: data.negativeCount,
      totalCount: data.totalCount
    };
  });

  // Trier par score décroissant et prendre top 3
  const top3 = scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Normaliser à 100%
  const totalScore = top3.reduce((sum, item) => sum + item.score, 0);
  
  if (totalScore === 0) return [];

  const normalized = top3.map((item, index) => {
    if (index < 2) {
      return {
        ...item,
        normalizedPct: Math.floor((item.score / totalScore) * 100)
      };
    } else {
      // Le 3ème = 100 - somme des 2 premiers
      const sumFirst2 = top3.slice(0, 2).reduce((sum, t) => 
        sum + Math.floor((t.score / totalScore) * 100), 0
      );
      return {
        ...item,
        normalizedPct: 100 - sumFirst2
      };
    }
  });

  return normalized as ThemeScore[];
}
