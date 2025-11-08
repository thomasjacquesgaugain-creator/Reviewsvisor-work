import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

type AuthCtx = {
  session: Session | null;
  user: User | null;
  displayName: string;
  loading: boolean;
  signOut: () => Promise<void>;
};

function getDisplayName(user: User | null): string {
  if (!user) return "";
  const m = user.user_metadata ?? {};
  const full =
    m.full_name ||
    m.name ||
    [m.given_name, m.family_name].filter(Boolean).join(" ").trim();
  const emailFallback = (user.email || "").split("@")[0];
  return (full || emailFallback || "").trim();
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider value={{ 
      session, 
      user,
      displayName: getDisplayName(user),
      loading, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};