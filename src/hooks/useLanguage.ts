import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthProvider';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/i18n/config';

const STORAGE_KEY = 'rv_lang';

export function useLanguage() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  const lang = i18n.language as SupportedLanguage;

  const setLang = useCallback(async (nextLang: SupportedLanguage) => {
    // 1) Change i18n language
    await i18n.changeLanguage(nextLang);

    // 2) Persist to localStorage
    localStorage.setItem(STORAGE_KEY, nextLang);

    // 3) If user is connected, update DB profile
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .upsert(
            { user_id: user.id, preferred_language: nextLang },
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
