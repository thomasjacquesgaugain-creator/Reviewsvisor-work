import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { capitalizeName } from "@/utils/capitalizeName";

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
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
  
  // Priority 1: profiles.display_name
  if (profile?.display_name?.trim()) {
    return capitalizeName(profile.display_name.trim());
  }
  
  // Priority 2: profiles.first_name + last_name (from database)
  if (profile) {
    const firstName = profile.first_name?.trim() || "";
    const lastName = profile.last_name?.trim() || "";
    if (firstName || lastName) {
      return capitalizeName(`${firstName} ${lastName}`.trim());
    }
  }
  
  // Priority 3: user_metadata first_name + last_name
  const m = user.user_metadata ?? {};
  const firstName = m.first_name?.trim() || "";
  const lastName = m.last_name?.trim() || "";
  
  if (firstName || lastName) {
    return capitalizeName(`${firstName} ${lastName}`.trim());
  }
  
  // Priority 4: user_metadata.name or full_name (OAuth)
  if (m.name?.trim()) return capitalizeName(m.name.trim());
  if (m.full_name?.trim()) return capitalizeName(m.full_name.trim());
  
  // Priority 5: given_name + family_name (Google OAuth)
  const givenName = m.given_name?.trim() || "";
  const familyName = m.family_name?.trim() || "";
  if (givenName || familyName) {
    return capitalizeName(`${givenName} ${familyName}`.trim());
  }
  
  // Priority 6: email fallback (ne pas capitaliser l'email)
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

  useEffect(() => {
    // Nettoyer les anciennes sessions dans localStorage au démarrage
    // (Supabase utilise maintenant sessionStorage, donc on nettoie les anciennes données)
    if (typeof window !== 'undefined') {
      // Clés spécifiques que Supabase pourrait utiliser dans localStorage
      const supabaseKeys = [
        'sb-zzjmtipdsccxmmoaetlp-auth-token',
        'supabase.auth.token',
        'supabase.auth.session',
        'sb-zzjmtipdsccxmmoaetlp-auth-token-code-verifier',
      ];
      
      // Supprimer les clés Supabase connues
      supabaseKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignorer les erreurs
        }
      });
      
      // Supprimer aussi les clés génériques d'auth si elles existent
      const genericAuthKeys = ['auth_token', 'user', 'session'];
      genericAuthKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          // Ignorer les erreurs
        }
      });
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        // Fetch profile when user logs in
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    // Nettoyer sessionStorage quand l'utilisateur quitte la page
    const handleBeforeUnload = () => {
      if (typeof window !== 'undefined') {
        // Nettoyer sessionStorage
        sessionStorage.clear();
        // S'assurer que Supabase se déconnecte
        supabase.auth.signOut().catch(() => {
          // Ignorer les erreurs si déjà déconnecté
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Optionnel : nettoyer quand l'onglet devient invisible
        // On peut aussi attendre beforeunload
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, full_name')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfile({
          id: data.id,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          display_name: data.display_name || data.full_name || null
        });
      } else if (!data) {
        // Pas de profil, on reste avec les métadonnées uniquement
        setProfile(null);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération du profil:', err);
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (session?.user) {
      await fetchProfile(session.user.id);
    }
  };

  const signOut = async () => {
    try {
      // 1️⃣ Déconnexion Supabase (supprime automatiquement ses propres tokens)
      await supabase.auth.signOut();

      // 2️⃣ Nettoyer sessionStorage (où la session est stockée maintenant)
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }

      // 3️⃣ Supprimer les anciennes clés d'auth de localStorage (nettoyage)
      const authKeys = ['auth_token', 'user', 'session'];
      authKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      // ⚠️ NE PAS faire localStorage.clear()
      // Les avis, établissements et autres données restent intacts
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Force le nettoyage de l'état local
      setSession(null);
      setProfile(null);
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