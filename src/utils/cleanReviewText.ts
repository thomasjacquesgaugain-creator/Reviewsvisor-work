/**
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
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

/**
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
