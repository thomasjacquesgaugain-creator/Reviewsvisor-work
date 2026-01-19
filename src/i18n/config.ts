import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fr from './locales/fr.json';
import en from './locales/en.json';
import it from './locales/it.json';
import es from './locales/es.json';
import pt from './locales/pt.json';

export const SUPPORTED_LANGUAGES = ['fr', 'en-GB', 'it', 'es', 'pt'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  fr: 'Français',
  'en-GB': 'English (GB)',
  it: 'Italiano',
  es: 'Español',
  pt: 'Português',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  fr: '🇫🇷',
  'en-GB': '🇬🇧',
  it: '🇮🇹',
  es: '🇪🇸',
  pt: '🇵🇹',
};

const resources = {
  fr: { translation: fr },
  // English (GB) is our canonical English. Keep a legacy 'en' alias for
  // navigator/localStorage values like 'en' or 'en-US'.
  'en-GB': { translation: en },
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
    // Prefer en-GB for any English variants.
    fallbackLng: {
      en: ['en-GB'],
      default: ['fr'],
    },
    supportedLngs: ['fr', 'en-GB', 'en', 'it', 'es', 'pt'],
    // Helps match e.g. navigator 'en-US' => 'en' => fallback to 'en-GB'.
    nonExplicitSupportedLngs: true,
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'rv_lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
