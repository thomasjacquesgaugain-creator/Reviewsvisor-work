import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

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
};

function getDisplayName(user: User | null, profile: Profile | null): string {
  if (!user) return "Invité";
  
  // Priority 1: profiles.display_name
  if (profile?.display_name?.trim()) {
    return profile.display_name.trim();
  }
  
  // Priority 2: user_metadata first_name + last_name
  const m = user.user_metadata ?? {};
  const firstName = m.first_name?.trim() || "";
  const lastName = m.last_name?.trim() || "";
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  // Priority 3: user_metadata.name or full_name (OAuth)
  if (m.name?.trim()) return m.name.trim();
  if (m.full_name?.trim()) return m.full_name.trim();
  
  // Priority 4: given_name + family_name (Google OAuth)
  const givenName = m.given_name?.trim() || "";
  const familyName = m.family_name?.trim() || "";
  if (givenName || familyName) {
    return `${givenName} ${familyName}`.trim();
  }
  
  // Priority 5: email fallback
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
  signOut: async () => {} 
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, full_name')
        .eq('id', userId)
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

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user,
      displayName: getDisplayName(user, profile),
      loading, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};