/**
 * Gestion des préférences de thème et personnalisation
 * Stockage localStorage + application via CSS variables et data attributes
 */

// Types
export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "blue" | "green" | "purple" | "pink" | "orange" | "red" | "teal" | "indigo";
export type BackgroundTint = "neutral" | "warm" | "cool" | "paleBlue" | "paleGreen" | "palePink" | "palePurple" | "cream" | "stone";

// Clés localStorage
const STORAGE_KEY_THEME = "rv_theme";
const STORAGE_KEY_ACCENT = "rv_accent";
const STORAGE_KEY_BG = "rv_bg";

// Valeurs par défaut
const DEFAULT_THEME: ThemeMode = "light";
const DEFAULT_ACCENT: AccentColor = "blue";
const DEFAULT_BG: BackgroundTint = "neutral";

// Mapping des couleurs d'accent vers les valeurs HSL
const ACCENT_COLORS: Record<AccentColor, string> = {
  blue: "217 76% 48%",
  green: "142 76% 36%",
  purple: "262 83% 58%",
  pink: "330 81% 60%",
  orange: "25 95% 53%",
  red: "0 84% 60%",
  teal: "173 80% 40%",
  indigo: "239 84% 67%",
};

// Mapping des fonds vers les valeurs HSL
const BACKGROUND_TINTS: Record<BackgroundTint, string> = {
  neutral: "220 26% 97%",
  warm: "30 30% 96%",
  cool: "210 60% 97%",
  paleBlue: "210 60% 97%",
  paleGreen: "142 30% 97%",
  palePink: "330 30% 98%",
  palePurple: "262 30% 97%",
  cream: "40 30% 98%",
  stone: "24 20% 96%",
};

/**
 * Récupère le thème depuis localStorage
 */
export function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (stored && ["light", "dark", "system"].includes(stored)) {
    return stored as ThemeMode;
  }
  return DEFAULT_THEME;
}

/**
 * Récupère la couleur d'accent depuis localStorage
 */
export function getStoredAccent(): AccentColor {
  const stored = localStorage.getItem(STORAGE_KEY_ACCENT);
  if (stored && Object.keys(ACCENT_COLORS).includes(stored)) {
    return stored as AccentColor;
  }
  return DEFAULT_ACCENT;
}

/**
 * Récupère le fond depuis localStorage
 */
export function getStoredBackground(): BackgroundTint {
  const stored = localStorage.getItem(STORAGE_KEY_BG);
  if (stored && Object.keys(BACKGROUND_TINTS).includes(stored)) {
    return stored as BackgroundTint;
  }
  return DEFAULT_BG;
}

/**
 * Détermine le thème effectif (résout "system" vers "light" ou "dark")
 */
export function getEffectiveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

/**
 * Applique la personnalisation complète au DOM
 * Fonction unique et robuste pour gérer theme, accent et background
 */
export function applyCustomization(config: {
  theme: ThemeMode;
  accent: AccentColor;
  bg: BackgroundTint;
}) {
  const root = document.documentElement;
  const effectiveTheme = getEffectiveTheme(config.theme);
  
  // 1. Sauvegarder dans localStorage
  localStorage.setItem(STORAGE_KEY_THEME, config.theme);
  localStorage.setItem(STORAGE_KEY_ACCENT, config.accent);
  localStorage.setItem(STORAGE_KEY_BG, config.bg);
  
  // 2. Définir les data attributes sur <html>
  root.setAttribute("data-theme", effectiveTheme);
  root.setAttribute("data-accent", config.accent);
  root.setAttribute("data-bg", config.bg);
  
  // 3. Mettre à jour les CSS variables
  root.style.setProperty("--rv-accent", ACCENT_COLORS[config.accent]);
  root.style.setProperty("--rv-bg", BACKGROUND_TINTS[config.bg]);
  root.style.setProperty("--app-bg", BACKGROUND_TINTS[config.bg]);
  
  // 4. Appliquer la classe dark si nécessaire (pour Tailwind)
  if (effectiveTheme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Applique le thème à l'élément HTML (fonction legacy, utilise applyCustomization)
 * @deprecated Utiliser applyCustomization à la place
 */
export function applyTheme(mode: ThemeMode, accent: AccentColor, bg: BackgroundTint) {
  applyCustomization({ theme: mode, accent, bg });
}

/**
 * Charge et applique la personnalisation depuis localStorage
 * À appeler au chargement de l'application (main.tsx ou App.tsx)
 */
export function loadCustomization() {
  const theme = getStoredTheme();
  const accent = getStoredAccent();
  const bg = getStoredBackground();
  applyCustomization({ theme, accent, bg });
  return { theme, accent, bg };
}

/**
 * Sauvegarde et applique le thème
 */
export function setTheme(mode: ThemeMode) {
  const accent = getStoredAccent();
  const bg = getStoredBackground();
  applyCustomization({ theme: mode, accent, bg });
}

/**
 * Sauvegarde et applique la couleur d'accent
 */
export function setAccent(accent: AccentColor) {
  const theme = getStoredTheme();
  const bg = getStoredBackground();
  applyCustomization({ theme, accent, bg });
}

/**
 * Sauvegarde et applique le fond
 */
export function setBackground(bg: BackgroundTint) {
  const theme = getStoredTheme();
  const accent = getStoredAccent();
  applyCustomization({ theme, accent, bg });
}

/**
 * Initialise le thème au chargement de l'application
 * @deprecated Utiliser loadCustomization() à la place
 */
export function initTheme() {
  loadCustomization();
  
  // Écouter les changements de préférence système si mode = "system"
  const theme = getStoredTheme();
  if (theme === "system") {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme = getStoredTheme();
      if (currentTheme === "system") {
        loadCustomization();
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    
    // Retourner une fonction de nettoyage
    return () => mediaQuery.removeEventListener("change", handleChange);
  }
}

/**
 * Liste des couleurs d'accent disponibles
 */
export const ACCENT_COLORS_LIST: Array<{ value: AccentColor; label: string; color: string }> = [
  { value: "blue", label: "Bleu", color: "#3b82f6" },
  { value: "green", label: "Vert", color: "#10b981" },
  { value: "purple", label: "Violet", color: "#a855f7" },
  { value: "pink", label: "Rose", color: "#ec4899" },
  { value: "orange", label: "Orange", color: "#f97316" },
  { value: "red", label: "Rouge", color: "#ef4444" },
  { value: "teal", label: "Sarcelle", color: "#14b8a6" },
  { value: "indigo", label: "Indigo", color: "#6366f1" },
];

/**
 * Liste des options de fond disponibles avec leurs couleurs
 */
export const BACKGROUND_TINTS_LIST: Array<{ 
  value: BackgroundTint; 
  label: string; 
  bg: string;
  preview: string; // Couleur hex pour l'aperçu
}> = [
  { value: "neutral", label: "Neutre", bg: "220 26% 97%", preview: "#f5f7fa" },
  { value: "warm", label: "Gris chaud", bg: "30 30% 96%", preview: "#f5f3f0" },
  { value: "cool", label: "Bleu pâle", bg: "210 60% 97%", preview: "#f0f4f8" },
  { value: "paleBlue", label: "Bleu doux", bg: "210 60% 97%", preview: "#e8f0f8" },
  { value: "paleGreen", label: "Vert doux", bg: "142 30% 97%", preview: "#f0f8f4" },
  { value: "palePink", label: "Rose doux", bg: "330 30% 98%", preview: "#faf0f5" },
  { value: "palePurple", label: "Violet doux", bg: "262 30% 97%", preview: "#f5f0fa" },
  { value: "cream", label: "Crème", bg: "40 30% 98%", preview: "#faf9f5" },
  { value: "stone", label: "Pierre", bg: "24 20% 96%", preview: "#f5f3f0" },
];

/**
 * Réinitialise tous les paramètres de thème aux valeurs par défaut
 * Supprime les clés localStorage et réapplique les valeurs par défaut
 */
export function resetTheme() {
  // Supprimer les clés localStorage
  localStorage.removeItem(STORAGE_KEY_THEME);
  localStorage.removeItem(STORAGE_KEY_ACCENT);
  localStorage.removeItem(STORAGE_KEY_BG);
  
  // Appliquer les valeurs par défaut
  applyCustomization({
    theme: DEFAULT_THEME,
    accent: DEFAULT_ACCENT,
    bg: DEFAULT_BG,
  });
}
