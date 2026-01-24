/**
<<<<<<< HEAD
 * Nettoie le texte d'un avis en extrayant uniquement la partie française
 * Supprime les marqueurs Google Translate : "(Translated by Google)" et "(Original)"
 * 
 * Format typique :
 * "(Translated by Google) Great cocktail (Original) super cocktail, services nickel"
 * → "super cocktail, services nickel"
 */
export function cleanReviewText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Chercher le marqueur "(Original)"
  const originalIndex = text.indexOf('(Original)');
  if (originalIndex !== -1) {
    // Extraire uniquement la partie après "(Original)"
    return text.substring(originalIndex + '(Original)'.length).trim();
  }
  
  // Chercher le marqueur "(Translated by Google)" et le supprimer
  let cleaned = text;
  cleaned = cleaned.replace(/\(Translated by Google\)/gi, '').trim();
  cleaned = cleaned.replace(/\(Original\)/gi, '').trim();
  
  // Supprimer les espaces multiples
=======
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
>>>>>>> origin/branche-papa
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
<<<<<<< HEAD
 * Liste complète des stop words à exclure du nuage de mots
 * Inclut les mots anglais parasites et les stop words français
 */
export const STOP_WORDS = new Set([
  // Mots anglais parasites de Google Translate
  'translated', 'google', 'original', 'by', 'the', 'and', 'but', 'very', 'great', 'good', 'excellent',
  'amazing', 'wonderful', 'nice', 'perfect', 'bad', 'terrible', 'awful', 'horrible', 'worst',
  'best', 'better', 'really', 'much', 'more', 'most', 'some', 'any', 'all', 'this', 'that',
  'these', 'those', 'was', 'were', 'been', 'have', 'has', 'had', 'will', 'would', 'should',
  'could', 'might', 'must', 'can', 'may', 'also', 'just', 'only', 'even', 'still', 'again',
  'already', 'always', 'never', 'often', 'sometimes', 'usually', 'rarely', 'here', 'there',
  'where', 'when', 'why', 'how', 'what', 'who', 'which', 'whose', 'whom', 'about', 'above',
  'across', 'after', 'against', 'along', 'among', 'around', 'before', 'behind', 'below',
  'beneath', 'beside', 'between', 'beyond', 'during', 'except', 'inside', 'into', 'near',
  'outside', 'over', 'through', 'throughout', 'under', 'until', 'upon', 'within', 'without',
  
  // Stop words français
  'très', 'mais', 'avec', 'pour', 'dans', 'plus', 'cette', 'sont', 'être', 'avoir', 'faire',
  'aller', 'venir', 'voir', 'dire', 'savoir', 'vouloir', 'pouvoir', 'devoir', 'falloir',
  'faire', 'mettre', 'prendre', 'donner', 'parler', 'trouver', 'laisser', 'passer', 'rester',
  'arriver', 'entrer', 'sortir', 'partir', 'monter', 'descendre', 'retourner', 'tenir',
  'servir', 'sembler', 'porter', 'ouvrir', 'fermer', 'finir', 'commencer', 'continuer',
  'permettre', 'compter', 'paraître', 'vivre', 'reprendre', 'rendre', 'garder', 'marcher',
  'suivre', 'croire', 'appeler', 'regarder', 'attendre', 'chercher', 'tenter', 'répondre',
  'arrêter', 'demander', 'comprendre', 'essayer', 'perdre', 'gagner', 'jouer', 'toucher',
  'sentir', 'goûter', 'acheter', 'vendre', 'payer', 'coûter', 'aimer', 'adorer', 'détester',
  'préférer', 'choisir', 'décider', 'résoudre', 'expliquer', 'montrer', 'cacher', 'découvrir',
  'apprendre', 'enseigner', 'étudier', 'travailler', 'aider', 'nuire', 'souffrir', 'guérir',
  'guérir', 'mourir', 'naître', 'grandir', 'vieillir', 'changer', 'devenir', 'rester',
  'aller', 'venir', 'arriver', 'partir', 'revenir', 'entrer', 'sortir', 'monter', 'descendre',
  'retourner', 'passer', 'traverser', 'approcher', 's\'approcher', 's\'éloigner', 'rejoindre',
  'quitter', 'laisser', 'garder', 'tenir', 'lâcher', 'prendre', 'donner', 'recevoir',
  'accepter', 'refuser', 'demander', 'offrir', 'vendre', 'acheter', 'payer', 'coûter',
  'mettre', 'enlever', 'retirer', 'ajouter', 'joindre', 'séparer', 'casser', 'réparer',
  'construire', 'détruire', 'créer', 'supprimer', 'ouvrir', 'fermer', 'commencer', 'finir',
  'continuer', 'arrêter', 'cesser', 'poursuivre', 'reprendre', 'recommencer', 'continuer',
  'faire', 'défaire', 'refaire', 'agir', 'réagir', 'bouger', 'arrêter', 'immobiliser',
  'poser', 'relever', 'lever', 'baisser', 'monter', 'descendre', 'grimper', 'tomber',
  'sauter', 'courir', 'marcher', 's\'arrêter', 'se lever', 's\'asseoir', 'se coucher',
  'dormir', 'réveiller', 'se réveiller', 's\'endormir', 'reposer', 'se reposer', 'travailler',
  'se reposer', 'jouer', 's\'amuser', 'se divertir', 'rire', 'sourire', 'pleurer', 'crier',
  'parler', 'dire', 'raconter', 'expliquer', 'décrire', 'montrer', 'indiquer', 'signaler',
  'préciser', 'détailler', 'résumer', 'conclure', 'commencer', 'terminer', 'finir', 'achever',
  'écouter', 'entendre', 'comprendre', 'saisir', 'apprendre', 'étudier', 'connaître', 'savoir',
  'ignorer', 'oublier', 'se souvenir', 'rappeler', 'se rappeler', 'penser', 'réfléchir',
  'songer', 'imaginer', 'rêver', 'souhaiter', 'espérer', 'craindre', 'redouter', 'avoir peur',
  'regarder', 'voir', 'apercevoir', 'distinguer', 'reconnaître', 'identifier', 'découvrir',
  'chercher', 'trouver', 'retrouver', 'perdre', 'égarer', 'cacher', 'montrer', 'exposer',
  'révéler', 'dévoiler', 'couvrir', 'recouvrir', 'découvrir', 'retirer', 'enlever', 'mettre',
  'poser', 'placer', 'ranger', 'déranger', 'organiser', 'arranger', 'préparer', 'apprêter',
  'acheter', 'vendre', 'marchander', 'négocier', 'payer', 'régler', 'rembourser', 'coûter',
  'valoir', 'mériter', 'gagner', 'perdre', 'gaspiller', 'économiser', 'dépenser', 'investir',
  'posséder', 'avoir', 'appartenir', 'recevoir', 'donner', 'offrir', 'prêter', 'emprunter',
  'rendre', 'rembourser', 'perdre', 'gagner', 'trouver', 'retrouver', 'chercher', 'rechercher',
  'aimer', 'adorer', 'affectionner', 'préférer', 'aimer mieux', 'détester', 'haïr', 'exécrer',
  'dédaigner', 'mépriser', 'respecter', 'estimer', 'apprécier', 'admirer', 'admirer',
  'féliciter', 'louer', 'blâmer', 'critiquer', 'reprocher', 'se plaindre', 'plaindre',
  'se réjouir', 'se féliciter', 'se vanter', 'se glorifier', 'être fier', 'être honteux',
  'avoir honte', 'se fâcher', 'se mettre en colère', 'être en colère', 'se calmer', 'calmer',
  'exciter', 'stimuler', 'encourager', 'décourager', 'démoraliser', 'remonter le moral',
  'rassurer', 'tranquiliser', 'inquiéter', 's\'inquiéter', 'se préoccuper', 'craindre',
  'avoir peur', 'redouter', 'espérer', 'souhaiter', 'désirer', 'vouloir', 'souhaiter',
  'avoir envie', 'envier', 'jalouser', 'être jaloux', 'être content', 'être heureux',
  'être satisfait', 'être mécontent', 'être malheureux', 'être triste', 'être déçu',
  'être surpris', 'être étonné', 'être stupéfait', 'être confus', 'être gêné', 'être honteux',
]);
=======
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
>>>>>>> origin/branche-papa
