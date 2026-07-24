import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";
import { useHydrateActiveEstablishment } from "@/hooks/useHydrateActiveEstablishment";
import { supabase } from "@/integrations/supabase/client";

const ONBOARDING_REDIRECT: Record<string, string> = {
  email_pending: "/inscription/verifier-email",
  email_verified: "/inscription/etablissement",
};

export default function Protected({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  useHydrateActiveEstablishment(user?.id);

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
        console.error("Protected: failed to load onboarding_status", error);
        // Fail closed — better to send them through onboarding again than
        // risk letting an unverified/unpaid session into the app.
        setRedirectTo("/inscription/verifier-email");
        setCheckingOnboarding(false);
        return;
      }

      const status = profile?.onboarding_status ?? "email_pending";
      if (status !== "active") {
        setRedirectTo(ONBOARDING_REDIRECT[status] ?? "/inscription/verifier-email");
      }
      setCheckingOnboarding(false);
    }

    checkOnboarding();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (redirectTo) return <Navigate to={redirectTo} replace />;

  return children;
}