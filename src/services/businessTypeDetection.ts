/**
 * Service de détection automatique du type de commerce
 * Combine plusieurs sources : Google Places types, analyse keywords, nom de l'établissement
 */

import { BusinessType, INDUSTRY_CONFIG } from '@/config/industry';

export interface BusinessTypeCandidate {
  type: BusinessType;
  confidence: number;
}

export interface BusinessTypeDetectionResult {
  type: BusinessType;
  confidence: number;
  candidates: BusinessTypeCandidate[];
  source: 'places' | 'keywords' | 'manual';
}

/**
 * Mapping des types Google Places vers nos business types
 */
const GOOGLE_PLACES_TYPE_MAPPING: Record<string, BusinessType> = {
  // Restaurant
  'restaurant': 'restaurant',
  'food': 'restaurant',
  'cafe': 'restaurant',
  'bar': 'restaurant',
  'meal_takeaway': 'restaurant',
  'meal_delivery': 'restaurant',
  'bakery': 'restaurant',
  
  // Salon de coiffure
  'hair_care': 'salon_coiffure',
  'beauty_salon': 'salon_coiffure',
  
  // Salle de sport
  'gym': 'salle_sport',
  'health': 'salle_sport',
  'spa': 'salle_sport',
  
  // Serrurier
  'locksmith': 'serrurier',
  
  // Retail chaussures
  'shoe_store': 'retail_chaussures',
  'clothing_store': 'retail_chaussures',
  
  // Institut beauté
  'beauty_salon': 'institut_beaute',
  'spa': 'institut_beaute',
};

/**
 * Keywords par secteur (français)
 */
const KEYWORDS_BY_TYPE: Record<BusinessType, string[]> = {
  restaurant: [
    'restaurant', 'resto', 'bistrot', 'brasserie', 'café', 'bar', 'pizzeria', 
    'burger', 'sushi', 'cuisine', 'manger', 'repas', 'plat', 'menu', 'table',
    'serveur', 'serveuse', 'chef', 'carte', 'vin', 'dessert'
  ],
  salon_coiffure: [
    'coiffeur', 'coiffeuse', 'salon', 'barber', 'barbier', 'hair', 'cheveux',
    'coloration', 'coupe', 'tresse', 'balayage', 'brushing', 'mèches', 'coiffure'
  ],
  salle_sport: [
    'gym', 'fitness', 'salle de sport', 'sport', 'musculation', 'crossfit',
    'yoga', 'pilates', 'cardio', 'entraînement', 'coach', 'équipement'
  ],
  serrurier: [
    'serrurier', 'serrurerie', 'dépannage', 'clé', 'clef', 'verrou', 'serrure',
    'ouverture', 'fermeture', 'sécurité', 'urgence'
  ],
  retail_chaussures: [
    'chaussure', 'chaussures', 'sneaker', 'basket', 'bottes', 'sandales',
    'magasin', 'boutique', 'retail', 'pointure', 'marque'
  ],
  institut_beaute: [
    'institut', 'beauté', 'beaute', 'esthétique', 'soin', 'massage', 'épilation',
    'manucure', 'pédicure', 'facial', 'corps', 'relaxation'
  ],
  autre: []
};

/**
 * Détecter le type de commerce depuis les types Google Places
 */
function detectFromGooglePlacesTypes(types: string[] | null | undefined): BusinessTypeDetectionResult | null {
  if (!types || !Array.isArray(types) || types.length === 0) {
    return null;
  }

  const scores: Record<BusinessType, number> = {
    restaurant: 0,
    salon_coiffure: 0,
    salle_sport: 0,
    serrurier: 0,
    retail_chaussures: 0,
    institut_beaute: 0,
    autre: 0
  };

  // Scoring basé sur le mapping
  types.forEach(type => {
    const mappedType = GOOGLE_PLACES_TYPE_MAPPING[type];
    if (mappedType) {
      scores[mappedType] += 10; // Score élevé pour correspondance exacte
    }
  });

  // Trouver le type avec le score le plus élevé
  const sorted = Object.entries(scores)
    .map(([type, score]) => ({ type: type as BusinessType, score }))
    .sort((a, b) => b.score - a.score);

  const top = sorted[0];
  if (top.score === 0) {
    return null; // Aucune correspondance
  }

  const confidence = Math.min(100, top.score * 10); // Convertir en 0-100
  const candidates = sorted
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => ({ type: s.type, confidence: Math.min(100, s.score * 10) }));

  return {
    type: top.type,
    confidence,
    candidates,
    source: 'places'
  };
}

/**
 * Détecter le type de commerce depuis les keywords (nom + avis)
 */
function detectFromKeywords(
  name: string,
  reviews: string[] = []
): BusinessTypeDetectionResult {
  const combinedText = `${name} ${reviews.join(' ')}`.toLowerCase();
  
  const scores: Record<BusinessType, number> = {
    restaurant: 0,
    salon_coiffure: 0,
    salle_sport: 0,
    serrurier: 0,
    retail_chaussures: 0,
    institut_beaute: 0,
    autre: 0
  };

  // Scoring basé sur les keywords
  Object.entries(KEYWORDS_BY_TYPE).forEach(([type, keywords]) => {
    keywords.forEach(keyword => {
      if (combinedText.includes(keyword.toLowerCase())) {
        scores[type as BusinessType] += 1;
      }
    });
  });

  // Normaliser les scores (le nom a plus de poids)
  const nameLower = name.toLowerCase();
  Object.entries(KEYWORDS_BY_TYPE).forEach(([type, keywords]) => {
    keywords.forEach(keyword => {
      if (nameLower.includes(keyword.toLowerCase())) {
        scores[type as BusinessType] += 2; // Bonus pour correspondance dans le nom
      }
    });
  });

  // Trouver le type avec le score le plus élevé
  const sorted = Object.entries(scores)
    .filter(([type]) => type !== 'autre')
    .map(([type, score]) => ({ type: type as BusinessType, score }))
    .sort((a, b) => b.score - a.score);

  if (sorted.length === 0 || sorted[0].score === 0) {
    return {
      type: 'autre',
      confidence: 0,
      candidates: [],
      source: 'keywords'
    };
  }

  const top = sorted[0];
  const maxPossibleScore = KEYWORDS_BY_TYPE[top.type].length * 3; // Estimation max
  const confidence = Math.min(100, Math.round((top.score / maxPossibleScore) * 100));
  
  const candidates = sorted
    .filter(s => s.score > 0)
    .slice(0, 3)
    .map(s => {
      const maxScore = KEYWORDS_BY_TYPE[s.type].length * 3;
      return {
        type: s.type,
        confidence: Math.min(100, Math.round((s.score / maxScore) * 100))
      };
    });

  return {
    type: top.type,
    confidence,
    candidates,
    source: 'keywords'
  };
}

/**
 * Détecter le type de commerce (fonction principale)
 * 
 * @param name Nom de l'établissement
 * @param googlePlacesTypes Types depuis Google Places API (optionnel)
 * @param reviewsTexts Textes des avis pour analyse keywords (optionnel)
 * @returns Résultat de détection avec type, confidence, candidates et source
 */
export function detectBusinessType(
  name: string,
  googlePlacesTypes?: string[] | null,
  reviewsTexts?: string[]
): BusinessTypeDetectionResult {
  // 1. Essayer d'abord avec Google Places types (plus fiable)
  if (googlePlacesTypes && googlePlacesTypes.length > 0) {
    const placesResult = detectFromGooglePlacesTypes(googlePlacesTypes);
    if (placesResult && placesResult.confidence >= 75) {
      return placesResult;
    }
    // Si confidence < 75, on continue avec keywords mais on garde le résultat Places comme candidat
  }

  // 2. Fallback sur keywords
  const keywordsResult = detectFromKeywords(name, reviewsTexts || []);

  // 3. Si on avait un résultat Places avec confidence < 75, fusionner les candidats
  if (googlePlacesTypes && googlePlacesTypes.length > 0) {
    const placesResult = detectFromGooglePlacesTypes(googlePlacesTypes);
    if (placesResult && placesResult.confidence < 75) {
      // Fusionner les candidats (priorité à Places)
      const mergedCandidates = [
        ...placesResult.candidates,
        ...keywordsResult.candidates.filter(
          k => !placesResult.candidates.some(p => p.type === k.type)
        )
      ].slice(0, 3);

      // Si keywords a une meilleure confidence, l'utiliser
      if (keywordsResult.confidence > placesResult.confidence) {
        return {
          ...keywordsResult,
          candidates: mergedCandidates
        };
      }

      return {
        ...placesResult,
        candidates: mergedCandidates
      };
    }
  }

  return keywordsResult;
}

/**
 * Valider et normaliser un business type
 */
export function normalizeBusinessType(type: string | null | undefined): BusinessType {
  const validTypes: BusinessType[] = [
    'restaurant',
    'salon_coiffure',
    'salle_sport',
    'serrurier',
    'retail_chaussures',
    'institut_beaute',
    'autre'
  ];

  if (type && validTypes.includes(type as BusinessType)) {
    return type as BusinessType;
  }

  return 'autre';
}
