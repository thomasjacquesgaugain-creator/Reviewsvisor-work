import { useState, useEffect } from "react";
import { Sun, Moon, Monitor, Check, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import {
  getStoredTheme,
  getStoredAccent,
  getStoredBackground,
  getStoredBackgroundBrightness,
  setTheme,
  setAccent,
  setBackground,
  setBackgroundBrightness,
  resetTheme,
  type ThemeMode,
  type AccentColor,
  type BackgroundTint,
  type BackgroundBrightness,
  ACCENT_COLORS_LIST,
  BACKGROUND_TINTS_LIST,
} from "@/utils/theme";
import { useTranslation } from "react-i18next";

export function CustomizationSettings() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
  const [accent, setAccentState] = useState<AccentColor>(() => getStoredAccent());
  const [bg, setBgState] = useState<BackgroundTint>(() => getStoredBackground());
  const [brightness, setBrightnessState] = useState<BackgroundBrightness>(() =>
    getStoredBackgroundBrightness(),
  );
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

  useEffect(() => {
    setBackgroundBrightness(brightness);
  }, [brightness]);

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

  const handleBrightnessChange = (newBrightness: number) => {
    const safeBrightness = Math.max(-50, Math.min(50, Math.round(newBrightness)));
    setBrightnessState(safeBrightness);
    setBackgroundBrightness(safeBrightness);
  };

  const handleReset = () => {
    // Réinitialiser les valeurs par défaut
    resetTheme();
    
    // Mettre à jour l'état local
    setThemeState("light");
    setAccentState("blue");
    setBgState("cottonCandy");
    setBrightnessState(0);
    
    // Afficher un toast de confirmation
    toast.success(t("settings.personalization.validation.settingsReset"));
  };

  return (
    <div className="p-8 text-gray-900 dark:text-slate-100">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-100">{t("settings.personalization.title")}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {t("settings.personalization.personalizationDescription")}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReset}
          className="gap-2 text-slate-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Réinitialiser les paramètres de personnalisation"
          title="Revenir à l'apparence par défaut"
        >
          <RotateCcw className="h-4 w-4" />
          <span>{t("settings.personalization.reset")}</span>
        </Button>
      </div>

      <div className="space-y-8">
        {/* Card Apparence */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-slate-100">{t("settings.personalization.appearance")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("settings.personalization.appearanceDescription")}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleThemeChange("light")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
                  "hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950",
                  theme === "light"
                    ? "border-primary bg-primary/10 dark:bg-primary/15 text-primary font-medium"
                    : "border-slate-200 dark:border-slate-700 text-gray-700 dark:text-slate-300",
                )}
            >
              <Sun className="h-4 w-4" />
              <span className="text-sm">{t("settings.personalization.light")}</span>
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
                  "hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950",
                  theme === "dark"
                    ? "border-primary bg-primary/10 dark:bg-primary/15 text-primary font-medium"
                    : "border-slate-200 dark:border-slate-700 text-gray-700 dark:text-slate-300",
                )}
            >
              <Moon className="h-4 w-4" />
              <span className="text-sm">{t("settings.personalization.dark")}</span>
            </button>
            <button
              onClick={() => handleThemeChange("system")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all",
                  "hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950",
                  theme === "system"
                    ? "border-primary bg-primary/10 dark:bg-primary/15 text-primary font-medium"
                    : "border-slate-200 dark:border-slate-700 text-gray-700 dark:text-slate-300",
                )}
            >
              <Monitor className="h-4 w-4" />
              <span className="text-sm">{t("settings.personalization.system")}</span>
            </button>
          </div>
        </div>

        {/* Card Couleur principale */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900">
          <div className="mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-slate-100">{t("settings.personalization.mainColour")}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
                  "hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950",
                  accent === color.value
                    ? "border-primary bg-primary/10 dark:bg-primary/15"
                    : "border-slate-200 dark:border-slate-700",
                )}
                aria-label={t(`settings.personalization.colors.${color.value}`)}
              >
                <div
                  className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: color.color }}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
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
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900">
          <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-slate-100">{t("settings.personalization.background")}</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {t("settings.personalization.backgroundDescription")}
              </p>
            </div>

            <div className="w-full max-w-[250px] rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(147,197,253,0.42),rgba(30,41,59,0.95))] text-white/85 shadow-[0_0_8px_rgba(96,165,250,0.16)]">
                  <Moon className="h-2.5 w-2.5" />
                </div>

                <Slider
                  value={[brightness]}
                  min={-50}
                  max={50}
                  step={1}
                  onValueChange={(values) => handleBrightnessChange(values[0] ?? 0)}
                  className="flex-1"
                  trackClassName="h-1 bg-[linear-gradient(90deg,#1e293b,#64748b,#f8fafc)]"
                  rangeClassName="bg-white/40"
                  thumbClassName="h-5 w-5 border-2 border-[#c4b5fd] bg-[#dbeafe] shadow-[0_0_0_2px_rgba(191,219,254,0.14),0_0_12px_rgba(196,181,253,0.35)]"
                  aria-label={t("settings.personalization.backgroundBrightness")}
                />

                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(254,240,138,0.95),rgba(245,158,11,0.9))] text-slate-900 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                  <Sun className="h-2.5 w-2.5" />
                </div>

                <div className="min-w-8 text-right text-[11px] font-semibold text-gray-700 dark:text-slate-300">
                  {brightness > 0 ? `+${brightness}` : brightness}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {BACKGROUND_TINTS_LIST.map((tint) => (
              <button
                key={tint.value}
                onClick={() => handleBackgroundChange(tint.value)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                  "hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-slate-950",
                  bg === tint.value
                    ? "border-primary bg-primary/5 dark:bg-primary/10"
                    : "border-slate-200 dark:border-slate-700",
                )}
                aria-label={t(`settings.personalization.backgroundColor.${tint.value}`)}
              >
                {/* Swatch de couleur */}
                <div
                  className="w-12 h-12 rounded-lg border-2 border-white shadow-sm"
                  style={{ background: tint.preview }}
                />
                <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
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
