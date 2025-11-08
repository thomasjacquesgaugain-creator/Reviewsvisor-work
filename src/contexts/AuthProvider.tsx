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
  if (!user) return "";
  
  // Priority 1: profiles.display_name
  if (profile?.display_name) return profile.display_name;
  
  // Priority 2: user_metadata first_name + last_name
  const m = user.user_metadata ?? {};
  const metaFullName = [m.first_name, m.last_name].filter(Boolean).join(" ").trim();
  if (metaFullName) return metaFullName;
  
  // Priority 3: user_metadata.name or full_name
  if (m.name) return m.name;
  if (m.full_name) return m.full_name;
  
  // Priority 4: given_name + family_name (Google OAuth)
  const oauthName = [m.given_name, m.family_name].filter(Boolean).join(" ").trim();
  if (oauthName) return oauthName;
  
  // Priority 5: email fallback
  const emailFallback = (user.email || "").split("@")[0];
  return emailFallback || "";
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
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (!error && data) {
        setProfile({
          id: data.id,
          first_name: data.first_name || null,
          last_name: data.last_name || null,
          display_name: data.display_name || null
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
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