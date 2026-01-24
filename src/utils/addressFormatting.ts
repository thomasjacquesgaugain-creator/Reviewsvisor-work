/**
 * Interface pour une adresse structurée
 * (Préparé pour une évolution future vers un objet plus complexe)
 */
export interface PostalAddress {
  line1: string;
  line2?: string;
  postalCode: string;
  city: string;
  country?: string;
}

/**
 * Formate une adresse pour l'affichage
 * Si c'est une string simple, la retourne telle quelle
 * Si c'est un objet PostalAddress, le formate sur 1-2 lignes
 */
export function formatAddress(address: string | PostalAddress | null | undefined): string {
  if (!address) return "";

  if (typeof address === "string") {
    return address;
  }

  // Format structuré
  const parts: string[] = [];
  if (address.line1) parts.push(address.line1);
  if (address.line2) parts.push(address.line2);
  if (address.postalCode && address.city) {
    parts.push(`${address.postalCode} ${address.city}`);
  } else if (address.postalCode) {
    parts.push(address.postalCode);
  } else if (address.city) {
    parts.push(address.city);
  }
  if (address.country) parts.push(address.country);

  return parts.join(", ");
}

/**
 * Parse une adresse string en objet PostalAddress (basique)
 * Pour l'instant, on garde la string telle quelle
 * Cette fonction peut être améliorée plus tard avec un parser plus sophistiqué
 */
export function parseAddress(address: string): string | PostalAddress {
  // Pour l'instant, on retourne la string telle quelle
  // TODO: Implémenter un parser plus sophistiqué si nécessaire
  return address;
}
