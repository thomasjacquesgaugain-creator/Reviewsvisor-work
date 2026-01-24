import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES, DEFAULT_COUNTRY, getCountryByCode } from "@/utils/countries";
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyByCode } from "@/utils/currencies";
import { LANGUAGES, DEFAULT_LANGUAGE, getLanguageCode } from "@/utils/languages";

// Clés localStorage
const STORAGE_KEY_LANGUAGE = "language";
const STORAGE_KEY_REGION = "rv_region";
const STORAGE_KEY_CURRENCY = "rv_currency";

export function LanguageSettings() {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState(() => {
    // Récupérer la valeur depuis localStorage ou i18n
    const stored = localStorage.getItem(STORAGE_KEY_LANGUAGE);
    if (stored) {
      // Si c'est un code court (ex: "fr"), le convertir en locale (ex: "fr-FR")
      const storedLang = LANGUAGES.find(l => l.value === stored || l.value.startsWith(stored + "-"));
      return storedLang ? storedLang.value : DEFAULT_LANGUAGE;
    }
    // Si i18n a un code court, trouver la locale correspondante
    const currentLang = i18n.language || "fr";
    const foundLang = LANGUAGES.find(l => l.value === currentLang || l.value.startsWith(currentLang + "-"));
    return foundLang ? foundLang.value : DEFAULT_LANGUAGE;
  });
  const [region, setRegion] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_REGION) || DEFAULT_COUNTRY;
  });
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CURRENCY) || DEFAULT_CURRENCY;
  });

  // Charger les préférences au montage
  useEffect(() => {
    const savedRegion = localStorage.getItem(STORAGE_KEY_REGION);
    const savedCurrency = localStorage.getItem(STORAGE_KEY_CURRENCY);
    
    if (savedRegion) setRegion(savedRegion);
    if (savedCurrency) setCurrency(savedCurrency);
  }, []);

  const handleLanguageChange = async (newLocale: string) => {
    try {
      // Extraire le code langue principal pour i18n (ex: "fr-FR" -> "fr")
      const languageCode = getLanguageCode(newLocale);
      
      // Changer la langue dans i18n (utilise le code court)
      await i18n.changeLanguage(languageCode);
      
      // Sauvegarder la locale complète dans le state et localStorage
      setLanguage(newLocale);
      localStorage.setItem(STORAGE_KEY_LANGUAGE, newLocale);
      
      // TODO: Sauvegarder dans Supabase profiles.localeLanguage
      // await supabase.from("profiles").upsert({ user_id: user.id, locale_language: newLocale });
      
      toast.success("Langue mise à jour");
    } catch (error) {
      console.error("Error changing language:", error);
      toast.error("Erreur lors du changement de langue");
    }
  };

  const handleRegionChange = (newRegion: string) => {
    try {
      setRegion(newRegion);
      localStorage.setItem(STORAGE_KEY_REGION, newRegion);
      
      // TODO: Sauvegarder dans Supabase profiles.regionCountry
      // await supabase.from("profiles").upsert({ user_id: user.id, region_country: newRegion });
      
      toast.success("Région mise à jour");
    } catch (error) {
      console.error("Error changing region:", error);
      toast.error("Erreur lors du changement de région");
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    try {
      setCurrency(newCurrency);
      localStorage.setItem(STORAGE_KEY_CURRENCY, newCurrency);
      
      // TODO: Sauvegarder dans Supabase profiles.currency
      // await supabase.from("profiles").upsert({ user_id: user.id, currency: newCurrency });
      
      toast.success("Devise mise à jour");
    } catch (error) {
      console.error("Error changing currency:", error);
      toast.error("Erreur lors du changement de devise");
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-8">Langue, Région & Devises</h1>

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Globe className="h-5 w-5 text-gray-400" />
          <h2 className="text-lg font-medium text-gray-900">Préférences linguistiques</h2>
        </div>

        <div className="space-y-6 max-w-md">
          {/* Langue */}
          <div className="space-y-2">
            <Label htmlFor="language">Langue de l'interface</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Cette langue sera utilisée pour l'interface de Reviewsvisor
            </p>
          </div>

          {/* Région */}
          <div className="space-y-2">
            <Label htmlFor="region">Région</Label>
            <Select value={region} onValueChange={handleRegionChange}>
              <SelectTrigger id="region" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Cette région sera utilisée pour les formats de dates, nombres et adresses
            </p>
          </div>

          {/* Devise */}
          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Select value={currency} onValueChange={handleCurrencyChange}>
              <SelectTrigger id="currency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((curr) => (
                  <SelectItem key={curr.code} value={curr.code}>
                    {curr.code} — {curr.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-500">
              Cette devise sera utilisée pour l'affichage des montants et tarifs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
