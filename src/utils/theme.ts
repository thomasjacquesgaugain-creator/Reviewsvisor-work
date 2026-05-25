/**
 * Gestion des préférences de thème et personnalisation
 * Stockage localStorage + application via CSS variables et data attributes
 */

// Types
export type ThemeMode = "light" | "dark" | "system";
export type AccentColor = "blue" | "green" | "purple" | "pink" | "orange" | "red" | "teal" | "indigo";
export type BackgroundTint = "cottonCandy" | "dusk" | "lavender";
export type BackgroundBrightness = number;

// Clés localStorage
const STORAGE_KEY_THEME = "rv_theme";
const STORAGE_KEY_ACCENT = "rv_accent";
const STORAGE_KEY_BG = "rv_bg";
const STORAGE_KEY_BG_BRIGHTNESS = "rv_bg_brightness";

// Valeurs par défaut
const DEFAULT_THEME: ThemeMode = "light";
const DEFAULT_ACCENT: AccentColor = "blue";
const DEFAULT_BG: BackgroundTint = "cottonCandy";
const DEFAULT_BG_BRIGHTNESS: BackgroundBrightness = 0;

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
  cottonCandy:
    "linear-gradient(135deg,#ff6eb4 0%,#c084fc 40%,#60a5fa 75%,#34d399 100%)",

  dusk:
    "linear-gradient(135deg,#4c1d95 0%,#2563eb 55%,#38bdf8 100%)",

  lavender:
    "linear-gradient(135deg,#ede8fb 0%,#ddd6f8 25%,#c5e8fc 65%,#d1fae5 100%)",
};

const LEGACY_BACKGROUND_TINTS: Record<string, BackgroundTint> = {
  neutral: "cottonCandy",
  palePink: "cottonCandy",
  warm: "dusk",
  stone: "dusk",
  cream: "dusk",
  cool: "lavender",
  paleBlue: "lavender",
  paleGreen: "lavender",
  palePurple: "lavender",
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
  if (stored && LEGACY_BACKGROUND_TINTS[stored]) {
    return LEGACY_BACKGROUND_TINTS[stored];
  }
  return DEFAULT_BG;
}

/**
 * Récupère la luminosité du fond depuis localStorage
 */
export function getStoredBackgroundBrightness(): BackgroundBrightness {
  const stored = localStorage.getItem(STORAGE_KEY_BG_BRIGHTNESS);
  const parsed = stored == null ? Number.NaN : Number(stored);
  if (Number.isFinite(parsed)) {
    return Math.max(-50, Math.min(50, Math.round(parsed)));
  }
  return DEFAULT_BG_BRIGHTNESS;
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
  brightness: BackgroundBrightness;
}) {
  const root = document.documentElement;
  const effectiveTheme = getEffectiveTheme(config.theme);
  const brightness = Math.max(-50, Math.min(50, Math.round(config.brightness)));
  const brightnessFactor = Math.max(0.7, Math.min(1.25, 1 + brightness / 200));
  
  // 1. Sauvegarder dans localStorage
  localStorage.setItem(STORAGE_KEY_THEME, config.theme);
  localStorage.setItem(STORAGE_KEY_ACCENT, config.accent);
  localStorage.setItem(STORAGE_KEY_BG, config.bg);
  localStorage.setItem(STORAGE_KEY_BG_BRIGHTNESS, String(brightness));
  
  // 2. Définir les data attributes sur <html>
  root.setAttribute("data-theme", effectiveTheme);
  root.setAttribute("data-accent", config.accent);
  root.setAttribute("data-bg", config.bg);
  
  // 3. Mettre à jour les CSS variables
  root.style.setProperty("--rv-accent", ACCENT_COLORS[config.accent]);
  root.style.setProperty("--rv-bg", BACKGROUND_TINTS[config.bg]);
  root.style.setProperty("--app-bg", BACKGROUND_TINTS[config.bg]);
  root.style.setProperty("--app-bg-brightness", String(brightness));
  root.style.setProperty("--app-bg-brightness-factor", String(brightnessFactor));
  
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
  const brightness = getStoredBackgroundBrightness();
  applyCustomization({ theme: mode, accent, bg, brightness });
}

/**
 * Charge et applique la personnalisation depuis localStorage
 * À appeler au chargement de l'application (main.tsx ou App.tsx)
 */
export function loadCustomization() {
  const theme = getStoredTheme();
  const accent = getStoredAccent();
  const bg = getStoredBackground();
  const brightness = getStoredBackgroundBrightness();
  applyCustomization({ theme, accent, bg, brightness });
  return { theme, accent, bg, brightness };
}

/**
 * Sauvegarde et applique le thème
 */
export function setTheme(mode: ThemeMode) {
  const accent = getStoredAccent();
  const bg = getStoredBackground();
  const brightness = getStoredBackgroundBrightness();
  applyCustomization({ theme: mode, accent, bg, brightness });
}

/**
 * Sauvegarde et applique la couleur d'accent
 */
export function setAccent(accent: AccentColor) {
  const theme = getStoredTheme();
  const bg = getStoredBackground();
  const brightness = getStoredBackgroundBrightness();
  applyCustomization({ theme, accent, bg, brightness });
}

/**
 * Sauvegarde et applique le fond
 */
export function setBackground(bg: BackgroundTint) {
  const theme = getStoredTheme();
  const accent = getStoredAccent();
  const brightness = getStoredBackgroundBrightness();
  applyCustomization({ theme, accent, bg, brightness });
}

/**
 * Sauvegarde et applique le Luminosité du fond
 */
export function setBackgroundBrightness(brightness: BackgroundBrightness) {
  const theme = getStoredTheme();
  const accent = getStoredAccent();
  const bg = getStoredBackground();
  applyCustomization({ theme, accent, bg, brightness });
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
  preview: string;
}> = [
  {
    value: "cottonCandy",
    label: "Cotton Candy",
    bg: "322 100% 97%",
    preview:
      "linear-gradient(135deg, rgb(255,110,180) 0%, rgb(192,132,252) 40%, rgb(96,165,250) 75%, rgb(52,211,153) 100%)",
  },
  {
    value: "dusk",
    label: "Dusk",
    bg: "224 44% 93%",
    preview:
      "linear-gradient(135deg,#4c1d95 0%,#2563eb 55%,#38bdf8 100%)",
  },
  {
    value: "lavender",
    label: "Lavender",
    bg: "258 60% 95%",
    preview:
      "linear-gradient(135deg,#ede8fb 0%,#ddd6f8 25%,#c5e8fc 65%,#d1fae5 100%)",
  },
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
  localStorage.removeItem(STORAGE_KEY_BG_BRIGHTNESS);
  
  // Appliquer les valeurs par défaut
  applyCustomization({
    theme: DEFAULT_THEME,
    accent: DEFAULT_ACCENT,
    bg: DEFAULT_BG,
    brightness: DEFAULT_BG_BRIGHTNESS,
  });
}
