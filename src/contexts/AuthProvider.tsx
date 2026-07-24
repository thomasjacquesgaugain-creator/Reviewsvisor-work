import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { capitalizeName } from "@/utils/capitalizeName";
import { useEstablishmentStore } from "@/store/establishmentStore";
import { useSmartStore } from "@/store/smartStore";
import i18n, { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n/config";
import { LANGUAGE_STORAGE_KEY } from "@/hooks/useLanguage";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  preferred_language: SupportedLanguage | null;
};

type AuthCtx = {
  session: Session | null;
  user: User | null;
  displayName: string;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

function getDisplayName(user: User | null, profile: Profile | null): string {
  if (!user) return "Invité";
  if (profile?.display_name?.trim()) {
    return capitalizeName(profile.display_name.trim());
  }
  if (profile) {
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    if (firstName || lastName) {
      return capitalizeName(`${firstName} ${lastName}`.trim());
    }
  }
  const m = user.user_metadata ?? {};
  const firstName = m.first_name?.trim() || "";
  const lastName = m.last_name?.trim() || "";
  if (firstName || lastName) {
    return capitalizeName(`${firstName} ${lastName}`.trim());
  }
  if (m.name?.trim()) return capitalizeName(m.name.trim());
  if (m.full_name?.trim()) return capitalizeName(m.full_name.trim());
  const givenName = m.given_name?.trim() || "";
  const familyName = m.family_name?.trim() || "";
  if (givenName || familyName) {
    return capitalizeName(`${givenName} ${familyName}`.trim());
  }
  if (user.email) {
    return user.email.split("@")[0];
  }
  return "Invité";
}

const AuthContext = createContext<AuthCtx>({ 
  session: null, 
  user: null,
  displayName: "",
  loading: true, 
  signOut: async () => {},
  refreshProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const hasBootstrappedRef = useRef(false);

const applyPreferredLanguage = async (
       preferredLanguage: SupportedLanguage | null,
       isInitialLoad: boolean,
   ) => {
       if (!preferredLanguage) return;
       if (!isInitialLoad) return;

       const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY) as SupportedLanguage | null;

       if (storedLang && SUPPORTED_LANGUAGES.includes(storedLang)) {
         if (storedLang !== i18n.language) {
           await i18n.changeLanguage(storedLang);
         }
         return; // local choice wins, don't touch localStorage or overwrite with DB
       }

       if (preferredLanguage !== i18n.language) {
         await i18n.changeLanguage(preferredLanguage);
       }
       localStorage.setItem(LANGUAGE_STORAGE_KEY, preferredLanguage);
   };
   
  const fetchProfile = async (userId: string, isInitialLoad: boolean) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, full_name, preferred_language')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        const preferredLanguage = SUPPORTED_LANGUAGES.includes(data.preferred_language as SupportedLanguage)
          ? data.preferred_language as SupportedLanguage
          : null;

        await applyPreferredLanguage(preferredLanguage, isInitialLoad);

        setProfile({
          id: data.id,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          display_name: data.display_name || data.full_name || null,
          preferred_language: preferredLanguage,
        });
      } else if (!data) {
        setProfile(null);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du profil:', err);
      setProfile(null);
    }
  };

  const hydrateSession = async (
    nextSession: Session | null,
    shouldBlockUi: boolean,
    isInitialLoad: boolean,
  ) => {
    setSession(nextSession);

    if (nextSession?.user) {
      if (shouldBlockUi) {
        setLoading(true);
      }

      await fetchProfile(nextSession.user.id, isInitialLoad);

      if (shouldBlockUi) {
        setLoading(false);
      }
      return;
    }

    setProfile(null);
    useEstablishmentStore.getState().clearSelectedEstablishment();

    if (shouldBlockUi) {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION" && hasBootstrappedRef.current) {
        return;
      }

      if (event === "SIGNED_OUT") {
        setSession(null);
        setProfile(null);
        useEstablishmentStore.getState().clearSelectedEstablishment();
        setLoading(false);
        return;
      }
      void hydrateSession(nextSession, false, !hasBootstrappedRef.current);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session: nextSession } }) =>
        hydrateSession(nextSession, true, true),
      )
      .finally(() => {
        hasBootstrappedRef.current = true;
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id, false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem('mon-etablissement');
      localStorage.removeItem('mes-etablissements');
      useSmartStore.persist.clearStorage();
      useSmartStore.getState().resetSmartState();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setSession(null);
      setProfile(null);
      useEstablishmentStore.getState().clearSelectedEstablishment();
    }
  };

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user,
      displayName: getDisplayName(user, profile),
      loading, 
      signOut,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};