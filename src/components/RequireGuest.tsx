import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

interface RequireGuestProps {
  children: React.ReactNode;
}

const ONBOARDING_REDIRECT: Record<string, string> = {
  email_pending: "/inscription/verifier-email",
  email_verified: "/inscription/etablissement",
  active: "/tableau-de-bord",
};
export default function RequireGuest({ children }: RequireGuestProps) {
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkOnboarding() {
      if (!user) {
        if (!cancelled) setCheckingOnboarding(false);
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_status")
        .eq("id", user.id)
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.error("RequireGuest: failed to load onboarding_status", error);
        setRedirectTo("/inscription/verifier-email");
        setCheckingOnboarding(false);
        return;
      }

      const status = profile?.onboarding_status ?? "email_pending";
      setRedirectTo(ONBOARDING_REDIRECT[status] ?? "/inscription/verifier-email");
      setCheckingOnboarding(false);
    }

    checkOnboarding();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // Show nothing while loading to prevent flash
  if (loading || (user && checkingOnboarding)) {
    return null;
  }

  if (user && redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
