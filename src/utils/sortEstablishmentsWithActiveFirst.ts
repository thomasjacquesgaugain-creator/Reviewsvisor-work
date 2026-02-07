/**
 * Type minimal pour un établissement listé (place_id requis, is_active optionnel).
 * Compatible EstablishmentData et tout objet avec place_id.
 */
export interface EstablishmentLike {
  place_id: string;
  is_active?: boolean | null;
  [key: string]: unknown;
}

/**
 * Trie un tableau d'établissements pour afficher l'établissement actif en premier,
 * puis les autres dans leur ordre d'origine (tri stable).
 *
 * Règles :
 * - Si activeId est fourni, l'établissement dont place_id === activeId est en premier.
 * - Si plusieurs sont "actifs" (bug), celui correspondant à activeId prime.
 * - Sinon, is_active === true est considéré comme actif (fallback).
 * - Ordre secondaire : ordre initial du tableau (stable sort).
 *
 * @param establishments - Tableau d'établissements (non muté)
 * @param activeId - place_id de l'établissement actif (contexte/store), optionnel
 * @returns Nouveau tableau trié (l'actif en premier, puis les autres)
 */
export function sortEstablishmentsWithActiveFirst<T extends EstablishmentLike>(
  establishments: T[],
  activeId?: string | null
): T[] {
  if (establishments.length <= 1) return [...establishments];

  const isPrimaryActive = (est: T) =>
    activeId != null && activeId !== "" && est.place_id === activeId;
  const isActive = (est: T) =>
    isPrimaryActive(est) || !!est.is_active;

  return [...establishments].sort((a, b) => {
    const aPrimary = isPrimaryActive(a);
    const bPrimary = isPrimaryActive(b);
    if (aPrimary && !bPrimary) return -1;
    if (!aPrimary && bPrimary) return 1;
    const aActive = isActive(a);
    const bActive = isActive(b);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0; // conserve l'ordre initial (stable)
  });
}
