import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getStoredTheme,
  getStoredAccent,
  getStoredBackground,
  setTheme,
  setAccent,
  setBackground,
  resetTheme,
  type ThemeMode,
  type AccentColor,
  type BackgroundTint,
  ACCENT_COLORS_LIST,
  BACKGROUND_TINTS_LIST,
} from "@/utils/theme";
import { useTranslation } from "react-i18next";

export function CustomizationSettings() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [accent, setAccentState] = useState<AccentColor>(() => getStoredAccent());
  const [bg, setBgState] = useState<BackgroundTint>(() => getStoredBackground());
  const { t } = useTranslation();

  // Appliquer les changements immédiatement
  useEffect(() => {
    setTheme(theme);
  }, [theme]);

  useEffect(() => {
    setAccent(accent);
  }, [accent]);

  useEffect(() => {
    setBackground(bg);
  }, [bg]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    setTheme(newTheme);
    toast.success(t("settings.personalization.validation.updatedAppearance"));
  };

  const handleAccentChange = (newAccent: AccentColor) => {
    setAccentState(newAccent);
    setAccent(newAccent);
    toast.success(t("settings.personalization.validation.colorUpdated"));
  };

  const handleBackgroundChange = (newBg: BackgroundTint) => {
    setBgState(newBg);
    setBackground(newBg);
    toast.success(t("settings.personalization.validation.backgroundUpdated"));
  };

  const handleReset = () => {
    // Réinitialiser les valeurs par défaut
    resetTheme();
    
    // Mettre à jour l'état local
    setThemeState("light");
    setAccentState("blue");
    setBgState("neutral");
    
    // Afficher un toast de confirmation
    toast.success(t("settings.personalization.validation.settingsReset"));
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t("settings.personalization.title")}</h1>
          <p className="text-sm text-gray-500 mt-2">
            {t("settings.personalization.personalizationDescription")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-2 text-gray-600 hover:text-gray-900"
          aria-label="Réinitialiser les paramètres de personnalisation"
          title="Revenir à l'apparence par défaut"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{t("settings.personalization.reset")}</span>
        </Button>
      </div>

      <div className="space-y-8">
        {/* Card Apparence */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">{t("settings.personalization.appearance")}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("settings.personalization.appearanceDescription")}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleThemeChange("light")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
                  "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  theme === "light"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-gray-200 text-gray-700"
                )}
            >
              <Sun className="h-4 w-4" />
              <span className="text-sm">{t("settings.personalization.light")}</span>
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
                  "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  theme === "dark"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-gray-200 text-gray-700"
                )}
            >
              <Moon className="h-4 w-4" />
              <span className="text-sm">{t("settings.personalization.dark")}</span>
            </button>
            <button
              onClick={() => handleThemeChange("system")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
                  "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  theme === "system"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-gray-200 text-gray-700"
                )}
            >
              <Monitor className="h-4 w-4" />
              <span className="text-sm">{t("settings.personalization.system")}</span>
            </button>
          </div>
        </div>

        {/* Card Couleur principale */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">{t("settings.personalization.mainColour")}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("settings.personalization.mainColourDescription")}
            </p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {ACCENT_COLORS_LIST.map((color) => (
              <button
                key={color.value}
                onClick={() => handleAccentChange(color.value)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  accent === color.value
                    ? "border-primary bg-primary/10"
                    : "border-gray-200"
                )}
                aria-label={t(`settings.personalization.colors.${color.value}`)}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-xs font-medium text-gray-700">
                  {t(`settings.personalization.colors.${color.value}`)}
                </span>
                {accent === color.value && (
                  <div className="absolute top-1 right-1">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Card Fond */}
        <div className="border border-gray-200 rounded-lg p-6 bg-white">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900">{t("settings.personalization.background")}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("settings.personalization.backgroundDescription")}
            </p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {BACKGROUND_TINTS_LIST.map((tint) => (
              <button
                key={tint.value}
                onClick={() => handleBackgroundChange(tint.value)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  bg === tint.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200"
                )}
                aria-label={t(`settings.personalization.backgroundColor.${tint.value}`)}
              >
                {/* Swatch de couleur */}
                <div
                  className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                  style={{ backgroundColor: tint.preview }}
                />
                <span className="text-xs font-medium text-gray-700">
                  {t(`settings.personalization.backgroundColor.${tint.value}`)}
                </span>
                {bg === tint.value && (
                  <div className="absolute top-1 right-1">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
