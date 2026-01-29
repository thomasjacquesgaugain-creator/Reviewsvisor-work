/**
 * Configuration de la taxonomie universelle multi-secteurs
 * Version: v2-auto-universal
 * 
 * Cette config définit :
 * - Les thèmes universels (tous secteurs)
 * - Les thèmes spécifiques par secteur
 * - Les hints de recommandations par secteur
 * - Les hints de ton pour les réponses par secteur
 */

export type BusinessType = 
  | 'restaurant' 
  | 'salon_coiffure' 
  | 'salle_sport' 
  | 'serrurier' 
  | 'retail_chaussures' 
  | 'institut_beaute' 
  | 'autre';

export interface IndustryConfig {
  universalThemes: string[];
  industryThemes: string[];
  recommendationHints: string[];
  replyToneHints: {
    positive: string;
    neutral: string;
    negative: string;
  };
}

/**
 * Thèmes universels applicables à tous les secteurs
 * Ces thèmes sont toujours extraits et affichés
 */
export const UNIVERSAL_THEMES = [
  'Accueil',
  'Propreté',
  'Prix',
  'Attente',
  'Communication',
  'SAV',
  'Confiance',
  'Ponctualité',
  'Disponibilité',
  'Professionnalisme'
];

/**
 * Configuration par secteur
 */
export const INDUSTRY_CONFIG: Record<BusinessType, IndustryConfig> = {
  restaurant: {
    universalThemes: UNIVERSAL_THEMES,
    industryThemes: [
      'Cuisine',
      'Plats',
      'Service en salle',
      'Menu',
      'Portions',
      'Desserts',
      'Boissons',
      'Ambiance',
      'Réservation'
    ],
    recommendationHints: [
      'Optimiser les temps de préparation',
      'Améliorer la qualité des ingrédients',
      'Former le personnel au service',
      'Adapter les portions aux attentes',
      'Créer une ambiance accueillante'
    ],
    replyToneHints: {
      positive: 'Chaleureux, remerciant, invitant à revenir',
      neutral: 'Professionnel, ouvert aux suggestions',
      negative: 'Empathique, proposant une solution concrète, invitant à revenir'
    }
  },

  salon_coiffure: {
    universalThemes: UNIVERSAL_THEMES,
    industryThemes: [
      'Coupe',
      'Coloration',
      'Brushing',
      'Coiffeur/Coiffeuse',
      'Conseils',
      'Techniques',
      'Produits utilisés',
      'Rendez-vous',
      'Durée de la prestation'
    ],
    recommendationHints: [
      'Optimiser la prise de rendez-vous',
      'Former aux dernières techniques',
      'Améliorer la consultation préalable',
      'Renforcer les protocoles d\'hygiène',
      'Clarifier les tarifs'
    ],
    replyToneHints: {
      positive: 'Reconnaissant, valorisant le travail, invitant à revenir',
      neutral: 'Professionnel, ouvert aux retours',
      negative: 'Empathique, proposant une correction, invitant à revenir pour améliorer'
    }
  },

  salle_sport: {
    universalThemes: UNIVERSAL_THEMES,
    industryThemes: [
      'Équipements',
      'Coachs',
      'Cours',
      'Vestiaires',
      'Horaires',
      'Abonnement',
      'Ambiance',
      'Sécurité',
      'Programmes'
    ],
    recommendationHints: [
      'Entretenir et renouveler les équipements',
      'Former les coaches régulièrement',
      'Améliorer les vestiaires et douches',
      'Adapter les horaires selon la demande',
      'Proposer des formules flexibles'
    ],
    replyToneHints: {
      positive: 'Motivant, encourageant, valorisant l\'effort',
      neutral: 'Professionnel, ouvert aux suggestions',
      negative: 'Empathique, proposant des améliorations concrètes'
    }
  },

  serrurier: {
    universalThemes: UNIVERSAL_THEMES,
    industryThemes: [
      'Rapidité d\'intervention',
      'Professionnalisme',
      'Disponibilité',
      'Prix',
      'Devis',
      'Qualité du travail',
      'Urgence',
      'Garantie'
    ],
    recommendationHints: [
      'Optimiser la réactivité',
      'Proposer des devis transparents',
      'Améliorer la disponibilité 24/7',
      'Former l\'équipe régulièrement',
      'Communiquer clairement sur les tarifs'
    ],
    replyToneHints: {
      positive: 'Reconnaissant, professionnel, rassurant',
      neutral: 'Professionnel, factuel',
      negative: 'Empathique, proposant une solution rapide, rassurant'
    }
  },

  retail_chaussures: {
    universalThemes: UNIVERSAL_THEMES,
    industryThemes: [
      'Produits',
      'Conseils',
      'Choix',
      'Disponibilité',
      'Essayage',
      'Qualité',
      'Marques',
      'Prix',
      'Vendeurs'
    ],
    recommendationHints: [
      'Améliorer le conseil client',
      'Gérer mieux les stocks',
      'Former les vendeurs',
      'Optimiser l\'espace d\'essayage',
      'Proposer des promotions attractives'
    ],
    replyToneHints: {
      positive: 'Reconnaissant, valorisant le choix',
      neutral: 'Professionnel, ouvert aux retours',
      negative: 'Empathique, proposant un échange/remboursement, invitant à revenir'
    }
  },

  institut_beaute: {
    universalThemes: UNIVERSAL_THEMES,
    industryThemes: [
      'Soins',
      'Produits',
      'Esthéticienne',
      'Conseils',
      'Ambiance',
      'Rendez-vous',
      'Résultats',
      'Hygiène',
      'Durée'
    ],
    recommendationHints: [
      'Améliorer la consultation préalable',
      'Utiliser des produits de qualité',
      'Former aux dernières techniques',
      'Créer une ambiance relaxante',
      'Optimiser la prise de rendez-vous'
    ],
    replyToneHints: {
      positive: 'Reconnaissant, valorisant le bien-être',
      neutral: 'Professionnel, ouvert aux retours',
      negative: 'Empathique, proposant une correction, invitant à revenir'
    }
  },

  autre: {
    universalThemes: UNIVERSAL_THEMES,
    industryThemes: [],
    recommendationHints: [
      'Améliorer le service client',
      'Renforcer la qualité des prestations',
      'Optimiser les processus',
      'Communiquer davantage',
      'Écouter les retours clients'
    ],
    replyToneHints: {
      positive: 'Reconnaissant, professionnel',
      neutral: 'Professionnel, ouvert',
      negative: 'Empathique, proposant une solution'
    }
  }
};

/** Labels affichables pour chaque type d'établissement */
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  restaurant: 'Restaurant',
  salon_coiffure: 'Salon de coiffure',
  salle_sport: 'Salle de sport',
  serrurier: 'Serrurier',
  retail_chaussures: 'Magasin de chaussures',
  institut_beaute: 'Institut de beauté',
  autre: 'Autre'
};

/**
 * Obtenir le label affichable pour un type (clé ou valeur brute)
 */
export function getBusinessTypeLabel(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  const key = value as BusinessType;
  if (BUSINESS_TYPE_LABELS[key]) return BUSINESS_TYPE_LABELS[key];
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, ' ');
}

/**
 * Obtenir la configuration pour un type de commerce
 */
export function getIndustryConfig(businessType: BusinessType): IndustryConfig {
  return INDUSTRY_CONFIG[businessType] || INDUSTRY_CONFIG.autre;
}

/**
 * Obtenir tous les thèmes (universels + métier) pour un type de commerce
 */
export function getAllThemesForBusinessType(businessType: BusinessType): string[] {
  const config = getIndustryConfig(businessType);
  return [...config.universalThemes, ...config.industryThemes];
}

/**
 * Vérifier si un thème est universel
 */
export function isUniversalTheme(theme: string): boolean {
  return UNIVERSAL_THEMES.some(ut => 
    ut.toLowerCase() === theme.toLowerCase() ||
    theme.toLowerCase().includes(ut.toLowerCase())
  );
}
