/**
 * Nettoie le texte d'un avis pour extraire la partie française
 * - Supprime les espaces multiples
 * - Normalise les caractères
 * - Extrait la partie française si le texte contient plusieurs langues
 */
export function cleanReviewText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Normaliser les espaces multiples
  let cleaned = text.trim().replace(/\s+/g, ' ');
  
  // Supprimer les caractères de contrôle et normaliser les sauts de ligne
  cleaned = cleaned.replace(/[\r\n]+/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Détecter et extraire la partie française si le texte contient "(Original)" ou des marqueurs similaires
  // Format Google : parfois le texte original est après "(Original)"
  const originalIndex = cleaned.indexOf('(Original)');
  if (originalIndex !== -1) {
    cleaned = cleaned.substring(originalIndex + '(Original)'.length).trim();
  }
  
  // Nettoyer les caractères échappés
  cleaned = cleaned.replace(/\\u0027/g, "'");
  cleaned = cleaned.replace(/\\n/g, ' ');
  cleaned = cleaned.replace(/\\r/g, ' ');
  
  // Normaliser à nouveau les espaces après nettoyage
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
 * Liste des mots vides (stop words) en français
 * Utilisés pour filtrer les mots non significatifs lors de l'analyse de texte
 */

// actual french words
export const STOP_WORDS2 = [
  // Articles
  'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux',
  // Pronoms
  'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles',
  'me', 'te', 'se', 'nous', 'vous', 'lui', 'leur',
  'ce', 'cet', 'cette', 'ces',
  // Prépositions
  'à', 'dans', 'sur', 'avec', 'sans', 'pour', 'par', 'sous', 'vers', 'chez',
  // Conjonctions
  'et', 'ou', 'mais', 'donc', 'car', 'ni', 'or',
  // Adverbes courants
  'très', 'plus', 'moins', 'bien', 'mal', 'trop', 'assez', 'beaucoup', 'peu',
  'aussi', 'encore', 'déjà', 'toujours', 'jamais', 'souvent', 'parfois',
  // Verbes auxiliaires
  'être', 'avoir', 'faire', 'aller', 'venir', 'pouvoir', 'vouloir', 'devoir',
  // Autres mots courants
  'que', 'qui', 'quoi', 'où', 'quand', 'comment', 'pourquoi',
  'si', 'comme', 'sans', 'avec', 'sous', 'sur', 'dans', 'par', 'pour',
  'ça', 'cela', 'celui', 'celle', 'ceux', 'celles',
  'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses', 'notre', 'votre', 'leur', 'leurs',
  'mien', 'tien', 'sien', 'nôtre', 'vôtre',
  // Mots de liaison
  'alors', 'ainsi', 'donc', 'puis', 'ensuite', 'après', 'avant', 'pendant',
  // Formes contractées
  "d'", "l'", "m'", "n'", "s'", "t'", "c'", "j'"
];



//testing for english
export const STOP_WORDS = new Set( [
  // Articles
  'the', 'a', 'an',
  
  // Pronouns
  'i', 'you', 'he', 'she', 'it', 'we', 'they',
  'me', 'him', 'her', 'us', 'them',
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves',
  'this', 'that', 'these', 'those',

  // Prepositions
  'in', 'on', 'at', 'with', 'without', 'for', 'by', 'under', 'over', 'between', 'into', 'onto', 'from', 'to', 'of',

  // Conjunctions
  'and', 'or', 'but', 'so', 'because', 'nor', 'yet',

  // Common adverbs
  'very', 'more', 'less', 'well', 'badly', 'too', 'quite', 'enough', 'much', 'many', 'little',
  'also', 'still', 'already', 'always', 'never', 'often', 'sometimes',

  // Auxiliary verbs
  'be', 'have', 'do', 'go', 'come', 'can', 'will', 'shall', 'must', 'may', 'might',

  // Common words
  'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'how', 'why',
  'if', 'as', 'than', 'while', 'though',

  // Demonstratives / determiners
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'mine', 'yours', 'his', 'hers', 'ours', 'theirs',

  // Linking words
  'then', 'thus', 'so', 'after', 'before', 'during', 'next',

  // Contractions
  "i'm", "you're", "he's", "she's", "it's", "we're", "they're",
  "i've", "you've", "we've", "they've",
  "i'll", "you'll", "he'll", "she'll", "we'll", "they'll",
  "don't", "doesn't", "didn't", "won't", "wouldn't", "can't", "couldn't", "shouldn't"
]);