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
export const STOP_WORDS = [
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
