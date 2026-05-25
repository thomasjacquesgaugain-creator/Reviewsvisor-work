import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/i18n/config';

export const LANGUAGE_STORAGE_KEY = 'rv_lang';

export function useLanguage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const lang = (SUPPORTED_LANGUAGES.includes(i18n.language as SupportedLanguage)
    ? i18n.language
    : "fr") as SupportedLanguage;

  const setLang = useCallback(async (nextLang: SupportedLanguage) => {
    await i18n.changeLanguage(nextLang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);

    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .upsert(
            {
              id: user.id,
              user_id: user.id,
              preferred_language: nextLang,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
      } catch (err) {
        console.warn('Could not save language preference to DB:', err);
      }
    }
  }, [i18n, user?.id]);

  const isSupported = (code: string): code is SupportedLanguage => {
    return SUPPORTED_LANGUAGES.includes(code as SupportedLanguage);
  };

  return {
    lang,
    setLang,
    isSupported,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
