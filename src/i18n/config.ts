import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import it from './locales/it.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

export const SUPPORTED_LANGUAGES = ['fr', 'en', 'it', 'es', 'pt'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  fr: 'Français',
  en: 'English',
  it: 'Italiano',
  es: 'Español',
  pt: 'Português',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  fr: '🇫🇷',
  en: '🇬🇧',
  it: '🇮🇹',
  es: '🇪🇸',
  pt: '🇵🇹',
};

const resources = {
  fr: { translation: fr },
  en: { translation: en },
  it: { translation: it },
  es: { translation: es },
  pt: { translation: pt },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fr',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'rv_lang',
      caches: ['localStorage'],
    },
    // Détection des clés manquantes en dev
    saveMissing: import.meta.env.DEV,
    missingKeyHandler: (lngs, ns, key, fallbackValue) => {
      if (import.meta.env.DEV) {
        console.warn(`⚠️ MISSING i18n KEY: [${ns}] ${key} (lang: ${lngs.join(', ')})`);
      }
    },
  });

// Mettre à jour html lang quand la langue change
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  localStorage.setItem('rv_lang', lng);
});

export default i18n;
