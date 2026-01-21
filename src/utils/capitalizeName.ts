/**
 * Capitalise la première lettre de chaque mot dans un nom
 * Exemples :
 * - "thomas bonder" → "Thomas Bonder"
 * - "paul dumont" → "Paul Dumont"
 * - "raphael crislin" → "Raphael Crislin"
 */
export function capitalizeName(name: string | null | undefined): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
