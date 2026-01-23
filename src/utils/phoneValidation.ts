/**
 * Valide un numéro de téléphone au format E.164
 * Format attendu : +[code pays][numéro] (ex: +33123456789)
 */
export function validatePhoneNumber(phone: string): { valid: boolean; error?: string } {
  if (!phone || phone.trim() === "") {
    return { valid: true }; // Vide est valide (optionnel)
  }

  const trimmed = phone.trim();

  // Format E.164 : commence par +, suivi de 1-3 chiffres (code pays), puis 4-14 chiffres
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  if (!e164Regex.test(trimmed)) {
    return {
      valid: false,
      error: "Le numéro doit être au format international (ex: +33123456789)",
    };
  }

  return { valid: true };
}

/**
 * Formate un numéro de téléphone pour l'affichage
 * Ex: +33123456789 -> +33 1 23 45 67 89
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return phone;

  // Si déjà formaté, retourner tel quel
  if (phone.includes(" ")) return phone;

  // Format basique : +33 1 23 45 67 89
  const match = phone.match(/^\+(\d{1,3})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (match) {
    const [, country, ...parts] = match;
    return `+${country} ${parts.join(" ")}`;
  }

  return phone;
}
