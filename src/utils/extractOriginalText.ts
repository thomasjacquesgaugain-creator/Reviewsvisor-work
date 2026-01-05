/**
 * Extrait le texte original d'un commentaire Google qui contient "(Translated by Google)" et "(Original)"
 * Si le texte contient "(Original)", retourne uniquement la partie après "(Original)"
 * Sinon, retourne le texte tel quel
 */
export function extractOriginalText(text: string | null | undefined): string {
  if (!text) return '';
  
  // Chercher le marqueur "(Original)"
  const originalIndex = text.indexOf('(Original)');
  if (originalIndex !== -1) {
    // Extraire tout ce qui est après "(Original)"
    return text.substring(originalIndex + '(Original)'.length).trim();
  }
  
  // Si pas de marqueur "(Original)", retourner le texte tel quel
  return text.trim();
}

