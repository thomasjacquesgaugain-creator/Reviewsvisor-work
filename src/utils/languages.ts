/**
 * Liste des langues européennes avec codes de locale et libellés en français
 * Triée alphabétiquement par libellé
 */
export interface Language {
  value: string; // Code de locale (ex: "fr-FR", "en-GB")
  label: string; // Libellé en français (ex: "Français", "Anglais (États-Unis)")
}

export const LANGUAGES: Language[] = [
  { value: "de-DE", label: "Allemand" },
  { value: "en-GB", label: "Anglais" },
  { value: "en-US", label: "Anglais (États-Unis)" },
  { value: "bg-BG", label: "Bulgare" },
  { value: "ca-ES", label: "Catalan" },
  { value: "hr-HR", label: "Croate" },
  { value: "cs-CZ", label: "Tchèque" },
  { value: "da-DK", label: "Danois" },
  { value: "es-ES", label: "Espagnol" },
  { value: "fi-FI", label: "Finnois" },
  { value: "fr-FR", label: "Français" },
  { value: "ga-IE", label: "Irlandais" },
  { value: "el-GR", label: "Grec" },
  { value: "hu-HU", label: "Hongrois" },
  { value: "it-IT", label: "Italien" },
  { value: "nl-NL", label: "Néerlandais" },
  { value: "nb-NO", label: "Norvégien" },
  { value: "pl-PL", label: "Polonais" },
  { value: "pt-PT", label: "Portugais" },
  { value: "pt-BR", label: "Portugais (Brésil)" },
  { value: "ro-RO", label: "Roumain" },
  { value: "ru-RU", label: "Russe" },
  { value: "sr-RS", label: "Serbe" },
  { value: "sk-SK", label: "Slovaque" },
  { value: "sl-SI", label: "Slovène" },
  { value: "sv-SE", label: "Suédois" },
  { value: "tr-TR", label: "Turc" },
  { value: "uk-UA", label: "Ukrainien" },
  { value: "cy-GB", label: "Gallois" },
].sort((a, b) => a.label.localeCompare(b.label, "fr"));

/**
 * Extrait le code langue principal d'un code de locale
 * Ex: "fr-FR" -> "fr", "en-GB" -> "en"
 */
export function getLanguageCode(locale: string): string {
  return locale.split("-")[0];
}

/**
 * Trouve une langue par son code de locale
 */
export function getLanguageByValue(value: string): Language | undefined {
  return LANGUAGES.find((lang) => lang.value === value);
}

/**
 * Valeur par défaut : Français
 */
export const DEFAULT_LANGUAGE = "fr-FR";
