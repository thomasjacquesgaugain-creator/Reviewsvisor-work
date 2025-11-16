import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Traitement du callback Google...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Callback Google OAuth";

    const run = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      const err = searchParams.get("error");

      if (err) {
        setError(`Erreur OAuth: ${err}`);
        return;
      }
      if (!code) {
        setError("Code d'autorisation manquant");
        return;
      }

      try {
        setMessage("Vérification de votre session...");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError("Session manquante. Veuillez vous connecter.");
          setTimeout(() => navigate("/login", { replace: true }), 1200);
          return;
        }

        setMessage("Échange du code contre des jetons Google...");
        const { data, error } = await supabase.functions.invoke("google-oauth-callback", {
          body: { code, state },
        });

        if (error) {
          console.error("Edge Function error:", error);
          throw new Error(error.message || "Échec de l'échange du code");
        }

        console.info("OAuth success:", data);
        setMessage("✅ Connexion Google réussie. Redirection...");
        setTimeout(() => navigate("/etablissement", { replace: true }), 600);
      } catch (e: any) {
        console.error("Callback processing error:", e);
        setError(e?.message || "Erreur inconnue lors du callback OAuth");
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <section className="max-w-md w-full p-6 rounded-xl border border-border bg-card text-card-foreground shadow">
        <h1 className="text-xl font-semibold mb-2">Connexion Google</h1>
        {!error ? (
          <>
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p>{message}</p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Chemin: /api/auth/callback/google</p>
            <meta name="robots" content="noindex,nofollow" />
            <link rel="canonical" href={`${window.location.origin}/api/auth/callback/google`} />
          </>
        ) : (
          <div>
            <p className="text-destructive">❌ {error}</p>
            <p className="mt-3 text-sm text-muted-foreground">Vous allez être redirigé(e) vers la connexion…</p>
          </div>
        )}
      </section>
    </main>
  );
}
